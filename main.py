from fastapi import FastAPI, HTTPException, status, Security, Header
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from database import supabase, ADMIN_API_KEY
from schemas import ReservationCreate, REOPENING_DATE, TableCreate, ClientAuth

app = FastAPI(
    title="API Chez Nany",
    description="Backend de gestion des réservations pour le restaurant Chez Nany",
    version="2.0.0"
)

api_key_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)

def verify_admin_key(api_key: str = Security(api_key_header)):
    if not api_key or api_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Accès non autorisé : clé Admin invalide ou manquante."
        )
    return api_key

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "restaurant": "Chez Nany",
        "reopening_date": REOPENING_DATE.isoformat()
    }

@app.get("/api/tables")
def get_tables():
    try:
        response = supabase.table("restaurant_tables").select("*").eq("is_active", True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur BDD: {str(e)}")

@app.post("/api/reservations", status_code=status.HTTP_201_CREATED)
def create_reservation(payload: ReservationCreate):
    try:
        req_date = payload.reservation_date.isoformat()
        req_time = payload.reservation_time
        
        if req_time.hour < 16:
            time_start, time_end = "00:00:00", "15:59:59"
        else:
            time_start, time_end = "16:00:00", "23:59:59"

        tables_res = supabase.table("restaurant_tables").select("*").eq("is_active", True).execute()
        tables = tables_res.data

        if not tables:
            raise HTTPException(status_code=500, detail="Aucune table configurée dans le restaurant.")

        total_restaurant_capacity = sum(t["capacity"] for t in tables)

        existing_res = supabase.table("reservations") \
            .select("people_count, status") \
            .eq("reservation_date", req_date) \
            .gte("reservation_time", time_start) \
            .lte("reservation_time", time_end) \
            .neq("status", "cancelled") \
            .execute()
        
        already_booked_seats = sum(r["people_count"] for r in existing_res.data)

        if already_booked_seats + payload.people_count > total_restaurant_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Désolé, le restaurant est complet pour ce service."
            )

        reservation_data = {
            "client_firstname": payload.client_firstname,
            "client_lastname": payload.client_lastname,
            "client_email": payload.client_email,
            "client_phone": payload.client_phone,
            "reservation_date": req_date,
            "reservation_time": req_time.isoformat(),
            "people_count": payload.people_count,
            "is_terrace": payload.is_terrace,
            "status": "confirmed",
            "notes": payload.notes
        }

        insert_res = supabase.table("reservations").insert(reservation_data).execute()

        if not insert_res.data:
            raise HTTPException(status_code=500, detail="Échec de l'enregistrement de la réservation.")

        return {
            "message": "Réservation confirmée avec succès !",
            "reservation": insert_res.data[0]
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne : {str(e)}")

@app.get("/api/reservations", dependencies=[Security(verify_admin_key)])
def get_all_reservations():
    try:
        response = supabase.table("reservations") \
            .select("*") \
            .order("reservation_date", desc=True) \
            .order("reservation_time", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur BDD: {str(e)}")

@app.delete("/api/reservations/{reservation_id}", dependencies=[Security(verify_admin_key)])
def delete_reservation(reservation_id: int):
    try:
        response = supabase.table("reservations") \
            .update({"status": "cancelled"}) \
            .eq("id", reservation_id) \
            .execute()
            
        if not response.data:
            raise HTTPException(status_code=404, detail="Réservation introuvable.")
            
        return {"message": f"La réservation {reservation_id} a bien été annulée."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne : {str(e)}")

@app.post("/api/client/reservations/search")
def search_client_reservations(auth: ClientAuth):
    try:
        response = supabase.table("reservations") \
            .select("*") \
            .eq("client_email", auth.client_email) \
            .eq("client_phone", auth.client_phone) \
            .order("reservation_date", desc=True) \
            .order("reservation_time", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur BDD: {str(e)}")

@app.post("/api/client/reservations/{reservation_id}/cancel")
def cancel_client_reservation(reservation_id: int, auth: ClientAuth):
    try:
        check = supabase.table("reservations").select("*").eq("id", reservation_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Réservation introuvable.")
        
        res = check.data[0]
        if res["client_email"] != auth.client_email or res["client_phone"] != auth.client_phone:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à annuler cette réservation.")
        
        if res["status"] == "cancelled":
            raise HTTPException(status_code=400, detail="Cette réservation est déjà annulée.")

        update = supabase.table("reservations").update({"status": "cancelled"}).eq("id", reservation_id).execute()
        return {"message": "Votre réservation a été annulée avec succès."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@app.post("/api/tables", dependencies=[Security(verify_admin_key)])
def create_table(table: TableCreate):
    try:
        location_name = "Terrasse" if table.is_terrace else "Intérieur"
        auto_name = f"Table {table.capacity}p ({location_name})"

        table_data = {
            "name": auto_name,
            "capacity": table.capacity,
            "is_terrace": table.is_terrace,
            "is_active": table.is_active
        }

        res = supabase.table("restaurant_tables").insert(table_data).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur BDD: {str(e)}")

@app.put("/api/tables/{table_id}", dependencies=[Security(verify_admin_key)])
def update_table(table_id: int, table: TableCreate):
    try:
        response = supabase.table("restaurant_tables").update(table.model_dump()).eq("id", table_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Table introuvable")
        return {"message": "Table mise à jour"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tables/{table_id}", dependencies=[Security(verify_admin_key)])
def delete_table(table_id: int):
    try:
        response = supabase.table("restaurant_tables").delete().eq("id", table_id).execute()
        return {"message": "Table supprimée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
