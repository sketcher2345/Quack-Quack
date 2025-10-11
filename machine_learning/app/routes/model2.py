from fastapi import APIRouter, UploadFile, File
import pandas as pd
import os
from models.model2_room_allocation.main import allocate_rooms

router = APIRouter()

@router.post("/allocate_rooms")
async def allocate_rooms_endpoint(
    rooms_file: UploadFile = File(...),
    teams_file: UploadFile = File(...)
):
    os.makedirs("data/inputs", exist_ok=True)
    os.makedirs("data/outputs", exist_ok=True)

    rooms_path = f"data/inputs/{rooms_file.filename}"
    teams_path = f"data/inputs/{teams_file.filename}"
    output_path = f"data/outputs/rooms_allocated_{teams_file.filename}"

    with open(rooms_path, "wb") as f:
        f.write(await rooms_file.read())
    with open(teams_path, "wb") as f:
        f.write(await teams_file.read())

    # Run model
    allocate_rooms(rooms_path, teams_path, output_path)

    return {"message": "Room allocation complete", "output_file": output_path}
