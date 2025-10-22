# ...existing code...
import csv
import io
import argparse
import os
import sys
from collections import defaultdict

def form_teams_from_csv(csv_content: str, score_threshold: int = 300, chunk_size: int = 5) -> str:
    """
    Forms teams of exactly `chunk_size` members (default 5) per group code.

    Rules:
    - Candidates are NOT filtered by any per-candidate threshold.
    - Candidates are grouped by the first code in their Eligible_To.
    - Teams are emitted only for full groups of `chunk_size` members whose
      summed skill score is >= score_threshold (default 300).
    - Partial groups (fewer than chunk_size members) are ignored (leftovers).
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

        score_raw = (row.get("Skill_Score") or row.get("skill_score") or row.get("score") or "").strip()
        try:
            score = float(score_raw)
        except (ValueError, TypeError):
            # invalid score: record but don't add to groups
            entries[name_key] = {"name": name, "score": None, "assigned_code": None, "allocated": False}
            continue

        eligible_raw = (row.get("Eligible_To") or row.get("eligible_to") or row.get("Eligible") or "").strip()
        if not eligible_raw:
            # has score but no eligible group -> leftover
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

    # create teams of exactly chunk_size and mark allocated members only if group sum >= threshold
    team_rows = []
    for code in sorted(groups.keys()):
        members = groups[code]
        if not members:
            continue
        members.sort(key=lambda m: m["score"] if m["score"] is not None else -1, reverse=True)

        team_num = 1
        for i in range(0, len(members), chunk_size):
            chunk = members[i:i + chunk_size]
            # Only consider full chunks of exactly chunk_size
            if len(chunk) != chunk_size:
                continue
            # compute total score for the chunk
            total = sum(m["score"] for m in chunk if isinstance(m.get("score"), (int, float)))
            if total >= score_threshold:
                names = "  ".join(m["name"] for m in chunk)
                # format scores with no unnecessary decimals
                scores = "  ".join(str(int(s["score"])) if float(s["score"]).is_integer() else f"{s['score']:.2f}" for s in chunk)
                team_rows.append({
                    "team_id": f"Team_{code.upper()}{team_num}",
                    "participant_names": names,
                    "score_list": scores
                })
                # mark allocated
                for m in chunk:
                    entries[m["name"].lower()]["allocated"] = True
                team_num += 1
            else:
                # do not allocate these members; they remain leftovers
                continue

    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=["team_id", "participant_names", "score_list"])
    writer.writeheader()
    writer.writerows(team_rows)
    csv_result = out.getvalue()

    # Compute leftovers: any candidate with a numeric score who was not allocated
    leftovers = [e["name"] for e in entries.values() if isinstance(e.get("score"), (int, float)) and not e.get("allocated")]
    if leftovers:
        print("\nLeftover candidates (not assigned to any emitted team):")
        for n in leftovers:
            print(f"- {n}")
    else:
        print("\nAll candidates with valid scores were assigned to teams (if possible).")

    return csv_result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create final teams CSV from candidate_results CSV")
    parser.add_argument("-i", "--input-file", required=True, help="Path to candidate_results CSV")
    parser.add_argument("-t", "--threshold", type=int, default=300, help="Team score threshold (default: 300)")
    parser.add_argument("-c", "--chunk-size", type=int, default=5, help="Exact team size when forming teams (default: 5)")
    parser.add_argument("-o", "--output-file", default="final_teams.csv", help="Output CSV path (default: final_teams.csv)")
    args = parser.parse_args()

    if not os.path.exists(args.input_file):
        print(f"Input file not found: {args.input_file}", file=sys.stderr)
        sys.exit(1)

    with open(args.input_file, "r", encoding="utf-8") as f:
        csv_input = f.read()

    csv_output = form_teams_from_csv(csv_input, score_threshold=args.threshold, chunk_size=args.chunk_size)

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