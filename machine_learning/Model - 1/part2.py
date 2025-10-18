# ...existing code...
import csv
import io
import argparse
import os
import sys
from collections import defaultdict

def form_teams_from_csv(csv_content: str, score_threshold: int = 60, chunk_size: int = 5, min_team_size: int = 4) -> str:
    """
    Forms teams based on candidate scores and Eligible_To groups.

    Each candidate is assigned to at most one group: the first code listed in their
    Eligible_To field (after splitting). Candidates with score < score_threshold are skipped.

    This function also prints names of candidates who passed the threshold but were not
    included in any emitted team (leftovers).
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    groups = defaultdict(list)
    entries = {}  # key: name_lower -> {name, score, assigned_code, allocated}

    for row in reader:
        name = (row.get("Name") or row.get("name") or "").strip()
        if not name:
            continue

        name_key = name.lower()
        # skip duplicate candidate rows (only first occurrence considered)
        if name_key in entries:
            continue

        score_raw = (row.get("Skill_Score") or row.get("Skill_Score".lower()) or row.get("score") or "").strip()
        try:
            score = int(float(score_raw))
        except (ValueError, TypeError):
            # record as not assigned (invalid score) but don't include in leftovers (didn't pass threshold)
            entries[name_key] = {"name": name, "score": None, "assigned_code": None, "allocated": False}
            continue

        # apply threshold filter here -- candidates below threshold are not considered for teams
        if score < score_threshold:
            entries[name_key] = {"name": name, "score": score, "assigned_code": None, "allocated": False}
            continue

        eligible_raw = (row.get("Eligible_To") or row.get("eligible_to") or row.get("Eligible") or "").strip()
        if not eligible_raw:
            # passed threshold but no eligible group -> leftover
            entries[name_key] = {"name": name, "score": score, "assigned_code": None, "allocated": False}
            continue

        # split eligible codes: allow comma/semicolon/pipe/space, otherwise treat as sequence of letters
        if any(sep in eligible_raw for sep in (",", ";", "|", " ")):
            parts = [p.strip() for p in csv.reader([eligible_raw]).__next__() if p.strip()]
            codes = []
            for p in parts:
                if len(p) > 1 and all(ch.isalpha() for ch in p):
                    codes.extend(list(p))
                else:
                    codes.append(p)
        else:
            codes = list(eligible_raw)

        if not codes:
            entries[name_key] = {"name": name, "score": score, "assigned_code": None, "allocated": False}
            continue

        assigned_code = codes[0].strip().lower()
        if not assigned_code:
            entries[name_key] = {"name": name, "score": score, "assigned_code": None, "allocated": False}
            continue

        groups[assigned_code].append({"name": name, "score": score})
        entries[name_key] = {"name": name, "score": score, "assigned_code": assigned_code, "allocated": False}

    # create teams and mark allocated members
    team_rows = []
    for code in sorted(groups.keys()):
        members = groups[code]
        if not members:
            continue
        members.sort(key=lambda m: m["score"], reverse=True)

        team_num = 1
        for i in range(0, len(members), chunk_size):
            chunk = members[i:i + chunk_size]
            if len(chunk) < min_team_size:
                # these members won't be emitted as a team -> remain unallocated (leftovers)
                continue
            names = "  ".join(m["name"] for m in chunk)
            scores = "  ".join(str(m["score"]) for m in chunk)
            team_rows.append({
                "team_id": f"Team_{code.upper()}{team_num}",
                "participant_names": names,
                "score_list": scores
            })
            # mark allocated
            for m in chunk:
                entries[m["name"].lower()]["allocated"] = True
            team_num += 1

    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=["team_id", "participant_names", "score_list"])
    writer.writeheader()
    writer.writerows(team_rows)
    csv_result = out.getvalue()

    # Compute leftovers: passed threshold (score is int) but not allocated to any emitted team
    leftovers = [e["name"] for e in entries.values() if isinstance(e.get("score"), (int, float)) and e.get("score") >= score_threshold and not e.get("allocated")]
    if leftovers:
        print("\nLeftover candidates (passed threshold but not assigned to any emitted team):")
        for n in leftovers:
            print(f"- {n}")
    else:
        print("\nAll eligible candidates were assigned to teams.")

    return csv_result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create final teams CSV from candidate_results CSV")
    parser.add_argument("-i", "--input-file", required=True, help="Path to candidate_results CSV")
    parser.add_argument("-t", "--threshold", type=int, default=60, help="Score threshold (default: 60)")
    parser.add_argument("-c", "--chunk-size", type=int, default=5, help="Chunk size when forming teams (default: 5)")
    parser.add_argument("-m", "--min-team-size", type=int, default=4, help="Minimum members to emit a team (default: 4)")
    parser.add_argument("-o", "--output-file", default="final_teams.csv", help="Output CSV path (default: final_teams.csv)")
    args = parser.parse_args()

    if not os.path.exists(args.input_file):
        print(f"Input file not found: {args.input_file}", file=sys.stderr)
        sys.exit(1)

    with open(args.input_file, "r", encoding="utf-8") as f:
        csv_input = f.read()

    csv_output = form_teams_from_csv(csv_input, score_threshold=args.threshold, chunk_size=args.chunk_size, min_team_size=args.min_team_size)

    try:
        with open(args.output_file, "w", encoding="utf-8", newline="") as f:
            f.write(csv_output)
    except PermissionError:
        print(f"Permission denied writing to '{args.output_file}'. Try a different -o path or close the file if it's open.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Failed to write '{args.output_file}': {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\nWrote teams to: {args.output_file}")
# ...existing code...