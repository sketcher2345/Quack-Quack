import pandas as pd

def allocate_rooms(teams, rooms, output_file="room_allocation.csv"):

    if isinstance(teams, str):
        teams = pd.read_csv(teams)
    if isinstance(rooms, str):
        rooms = pd.read_csv(rooms)
 
    teams = teams.sort_values(by="size", ascending=False).reset_index(drop=True)

    rooms["remaining_capacity"] = rooms["capacity"]
    
    assignments = []

    for _, team in teams.iterrows():
        allocated = False
        for idx, room in rooms.iterrows():
            if room["remaining_capacity"] >= team["size"]:
                assignments.append({"team": team["team"], "room": room["room"]})
                rooms.loc[idx, "remaining_capacity"] -= team["size"]
                allocated = True
                break
        if not allocated:
            assignments.append({"team": team["team"], "room": "None"})

    allocation_df = pd.DataFrame(assignments)

    allocation_df["room_sort"] = allocation_df["room"].apply(
        lambda x: int(x.replace("Room", "")) if x.startswith("Room") else 99999
)
    allocation_df = allocation_df.sort_values(by=["room_sort", "team"]).drop(columns=["room_sort"])

    allocation_df.to_csv(output_file, index=False)
    print(f"✅ Allocation saved to {output_file}")

    return allocation_df