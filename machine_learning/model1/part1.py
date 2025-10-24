import csv
import io

def evaluate_candidate(name, skills):
    # 1️⃣ Updated skill scores according to new library
    skill_scores = {
        "React": 5.5,
        "Next.js": 6.5,
        "Javascript/Typescript": 7.0,
        "Express.js": 4.5,
        "Python": 6.5,
        "Flask/FastAPI": 5.0,
        "PostgreSQL/MongoDB": 5.0,
        "AWS": 6.5,
        "GCP": 5.0,
        "Azure": 4.5,
        "Tensorflow/Pytorch": 6.5,
        "OpenCV": 4.0,
        "Prisma": 3.5,
        "TailwindCss": 3.5,
        "Recoil": 3.0,
        "Redux": 4.5,
        "TanStack Query": 3.5,
        "Zustand": 3.0,
        "Socket.io": 4.5,
        "Hono.js": 3.0
    }

    # ...existing code...
    # 2️⃣ Primary language dictionary remains the same
    primary_languages = {
        "java": "a",
        "c": "b",
        "python": "c",
        "Javascript/Typescript": "d"
    }

    # Rest of the code remains the same
    total_score = 0
    eligible_to = ""

    for skill in skills:
        if skill in skill_scores:
            total_score += skill_scores[skill]

    for lang, code in primary_languages.items():
        if any(lang.lower() in s.lower() for s in skills):
            eligible_to += code

    return name, total_score, eligible_to

# ...existing code...

# ⚙️ Example use case
def generate_candidate_csv(name, skills):
    candidate_name, score, eligible_to = evaluate_candidate(name, skills)

    # Prepare CSV in-memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Skill_Score", "Eligible_To"])
    writer.writerow([candidate_name, score, eligible_to])

    return output.getvalue()


# 🧪 Example test
# ...existing code...

if __name__ == "__main__":
    # Sample candidate data
    test_candidates = [
        ("Anish", ["Python", "Flask/FastAPI", "AWS", "Javascript/Typescript"]),
        ("Priya", ["React", "Next.js", "Javascript/Typescript", "TailwindCss"]),
        ("Rajesh", ["Java", "AWS", "PostgreSQL/MongoDB"]),
        ("Sarah", ["Python", "Tensorflow/Pytorch", "GCP", "OpenCV"]),
        ("Amit", ["C", "Socket.io", "Express.js"])
    ]

    # Generate CSV for each candidate
    print("Generating CSVs for multiple candidates:")
    print("-" * 50)
    
    for name, skills in test_candidates:
        print(f"\nCandidate: {name}")
        print(f"Skills: {', '.join(skills)}")
        print("Generated CSV:")
        csv_output = generate_candidate_csv(name, skills)
        print(csv_output)
        print("-" * 50)

    # Optionally save to file
    with open("candidates.csv", "w", newline="") as f:
        f.write("Name,Skill_Score,Eligible_To\n")
        for name, skills in test_candidates:
            _, score, eligible = evaluate_candidate(name, skills)
            f.write(f"{name},{score},{eligible}\n")
