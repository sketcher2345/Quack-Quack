import pandas as pd

def generate_teams(df: pd.DataFrame, output_path: str):
    # Example logic
    df["team_number"] = range(1, len(df) + 1)
    df.to_csv(output_path, index=False)
