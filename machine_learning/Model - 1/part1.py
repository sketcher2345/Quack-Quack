import csv
import io

def evaluate_candidate(name, skills):
    # 1️⃣ Hardcoded skill scores
    skill_scores = {
        "React": 8,
        "Next.js": 9,
        "Javascript/Typescript": 10,
        "Express.js": 7,
        "Python": 9,
        "Flask/FastAPI": 8,
        "PostgreSQL/MongoDB": 8,
        "AWS": 9,
        "GCP": 8,
        "Azure": 8,
        "Tensorflow/Pytorch": 9,
        "OpenCV": 7,
        "Prisma": 6,
        "TailwindCss": 6,
        "Recoil": 5,
        "Redux": 7,
        "TanStack Query": 6,
        "Zustand": 5,
        "Socket.io": 7,
        "Hono.js": 5
    }

    # 2️⃣ Primary language dictionary
    primary_languages = {
        "java": "a",
        "c": "b",
        "python": "c",
        "Javascript/Typescript": "d"
    }

    # 3️⃣ Initialize variables
    total_score = 0
    eligible_to = ""

    # 4️⃣ Calculate total score
    for skill in skills:
        if skill in skill_scores:
            total_score += skill_scores[skill]

    # 5️⃣ Determine eligibility
    for lang, code in primary_languages.items():
        if any(lang.lower() in s.lower() for s in skills):
            eligible_to += code

    # 6️⃣ Return results
    return name, total_score, eligible_to


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
if __name__ == "__main__":
    candidate_name = "Anish"
    candidate_skills = ["Python", "Flask/FastAPI", "AWS", "Javascript/Typescript"]
    csv_output = generate_candidate_csv(candidate_name, candidate_skills)
    print(csv_output)
