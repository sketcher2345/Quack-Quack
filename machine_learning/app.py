from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import shutil
from io import BytesIO
import pandas as pd

from machine_learning.model2.main import allocate_rooms   
from machine_learning.model3.main import get_predictions_csv_path_for
import tempfile


app = FastAPI(title="Machine Learning Models API")

BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "Welcome to the Machine Learning Models API"}


# --- Model 1 Endpoint ---


# --- Model 2 Endpoint upload two CSVs, save + download) ---
@app.post("/model2/upload")
async def upload_and_run_model2(teams_file: UploadFile = File(...), rooms_file: UploadFile = File(...)):
    try:
        teams_df = pd.read_csv(BytesIO(await teams_file.read()))
        rooms_df = pd.read_csv(BytesIO(await rooms_file.read()))

        os.makedirs(OUTPUT_DIR, exist_ok=True)
        final_output_path = os.path.abspath(os.path.join(OUTPUT_DIR, "room_allocation.csv"))
        allocate_rooms(teams_df, rooms_df, final_output_path)

        if not os.path.exists(final_output_path):
            raise RuntimeError("Model 2 did not produce an output CSV.")

        return FileResponse(final_output_path, filename="room_allocation.csv", media_type="text/csv")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Model 3 Endpoint (upload CSV, save + download) ---
@app.post("/model3/upload")
async def upload_and_run_model3(file: UploadFile = File(...)):
    try:
        fd, temp_input_path = tempfile.mkstemp(suffix=".csv")
        os.close(fd)
        contents = await file.read()
        with open(temp_input_path, "wb") as f:
            f.write(contents)

        source_output = os.path.abspath(get_predictions_csv_path_for(temp_input_path))
        
        if not os.path.exists(source_output):
            raise RuntimeError(f"Model 3 did not produce an output CSV at: {source_output}")

        final_output_path = os.path.abspath(os.path.join(OUTPUT_DIR, "predicted_scores.csv"))
        os.makedirs(os.path.dirname(final_output_path), exist_ok=True)
        try:
            shutil.copyfile(source_output, final_output_path)
            path_to_return = final_output_path
        except Exception:
            path_to_return = source_output

        return FileResponse(path_to_return, filename="predicted_scores.csv", media_type="text/csv")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            if 'temp_input_path' in locals() and os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except Exception:
            pass
