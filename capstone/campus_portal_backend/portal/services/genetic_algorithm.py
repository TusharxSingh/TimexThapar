import random
from collections import defaultdict
from datetime import datetime, time, timedelta
import requests

# GA Hyperparameters
POPULATION_SIZE = 50
GENERATIONS = 100
MUTATION_RATE = 0.1

# Constants
LUNCH_START = time(13, 0)
LUNCH_END = time(13, 50)

# --- MAIN FUNCTION ---
def generate_timetable(teachers, courses, rooms, timeslots, constraints):
    max_hours = constraints.get("max_hours_per_day", 5)

    valid_timeslot_map = {"Lab": [], "Theatre": []}
    for idx, ts in enumerate(timeslots):
        start_str, end_str = ts["slot"].split(" - ")
        start = datetime.strptime(start_str.strip(), "%H:%M").time()
        end = datetime.strptime(end_str.strip(), "%H:%M").time()
        duration = (datetime.combine(datetime.today(), end) - datetime.combine(datetime.today(), start)).seconds // 60

        if (LUNCH_START <= start < LUNCH_END) or (LUNCH_START < end <= LUNCH_END):
            continue

        if 45 <= duration <= 55:
            valid_timeslot_map["Theatre"].append(idx)
            valid_timeslot_map["Lab"].append(idx)

    population = [
        create_random_timetable(courses, rooms, teachers, valid_timeslot_map, timeslots)
        for _ in range(POPULATION_SIZE)
    ]

    for _ in range(GENERATIONS):
        fitness_scores = [
            fitness(ind, courses, teachers, rooms, timeslots, max_hours, valid_timeslot_map)
            for ind in population
        ]
        next_gen = [population[fitness_scores.index(max(fitness_scores))]]

        while len(next_gen) < POPULATION_SIZE:
            p1 = select(population, fitness_scores)
            p2 = select(population, fitness_scores)
            child = crossover(p1, p2)
            mutate(child, courses, rooms, teachers, valid_timeslot_map, timeslots)
            next_gen.append(child)

        population = next_gen

    best = max(population, key=lambda ind: fitness(ind, courses, teachers, rooms, timeslots, max_hours, valid_timeslot_map))
    formatted_result = format_result_for_display(best, courses, teachers, rooms, timeslots)
    post_timetable_to_django_api(formatted_result)
    return formatted_result

# --- TIMETABLE CREATION ---
def create_random_timetable(courses, rooms, teachers, valid_timeslot_map, timeslots):
    timetable = {}
    room_type_map = {room["id"]: room["type"] for room in rooms}

    teacher_day_lecture = defaultdict(lambda: defaultdict(bool))
    teacher_day_lab_subjects = defaultdict(lambda: defaultdict(set))
    used_timeslots = set()

    for course in courses:
        num_labs = course["number_of_labs"]
        teacher_id = course["teacher_id"]

        for _ in range(num_labs):
            preferred_rooms = [r for r in rooms if r["type"] == "Lab"]
            if not preferred_rooms or len(valid_timeslot_map["Lab"]) < 2:
                continue

            attempts = 0
            while attempts < 50:
                idx = random.randint(0, len(valid_timeslot_map["Lab"]) - 2)
                ts1 = valid_timeslot_map["Lab"][idx]
                ts2 = valid_timeslot_map["Lab"][idx + 1]

                day1 = timeslots[ts1]["day"]
                day2 = timeslots[ts2]["day"]

                if day1 == day2 and ts2 == ts1 + 1:
                    if (ts1 in used_timeslots) or (ts2 in used_timeslots):
                        attempts += 1
                        continue

                    if course["id"] in teacher_day_lab_subjects[teacher_id][day1]:
                        attempts += 1
                        continue

                    timetable.setdefault(course["id"], {"lectures": [], "labs": []})

                    slot1_start, _ = timeslots[ts1]["slot"].split(" - ")
                    _, slot2_end = timeslots[ts2]["slot"].split(" - ")
                    combined_slot = f"{slot1_start.strip()} - {slot2_end.strip()}"

                    timetable[course["id"]]["labs"].append({
                        "room_id": random.choice(preferred_rooms)["id"],
                        "timeslot_ids": [ts1, ts2],
                        "timeslot_day": day1,
                        "combined_slot": combined_slot,
                    })

                    used_timeslots.add(ts1)
                    used_timeslots.add(ts2)
                    teacher_day_lab_subjects[teacher_id][day1].add(course["id"])
                    break
                attempts += 1

    for course in courses:
        num_lectures = course["number_of_lectures"]
        teacher_id = course["teacher_id"]

        timetable.setdefault(course["id"], {"lectures": [], "labs": []})

        for _ in range(num_lectures):
            preferred_rooms = [r for r in rooms if r["type"] == "Theatre"]
            if not preferred_rooms or not valid_timeslot_map["Theatre"]:
                continue

            assigned = False
            attempts = 0

            while attempts < 50:
                selected_ts = random.choice(valid_timeslot_map["Theatre"])
                ts = timeslots[selected_ts]
                day = ts["day"]

                if (selected_ts not in used_timeslots) and not teacher_day_lecture[teacher_id][day]:
                    timetable[course["id"]]["lectures"].append({
                        "room_id": random.choice(preferred_rooms)["id"],
                        "timeslot_id": selected_ts,
                        "timeslot_day": ts["day"],
                        "timeslot_slot": ts["slot"],
                    })
                    used_timeslots.add(selected_ts)
                    teacher_day_lecture[teacher_id][day] = True
                    assigned = True
                    break

                attempts += 1

            if not assigned:
                for ts_idx in valid_timeslot_map["Theatre"]:
                    ts = timeslots[ts_idx]
                    day = ts["day"]

                    if ts_idx not in used_timeslots and not teacher_day_lecture[teacher_id][day]:
                        timetable[course["id"]]["lectures"].append({
                            "room_id": random.choice(preferred_rooms)["id"],
                            "timeslot_id": ts_idx,
                            "timeslot_day": ts["day"],
                            "timeslot_slot": ts["slot"],
                        })
                        used_timeslots.add(ts_idx)
                        teacher_day_lecture[teacher_id][day] = True
                        assigned = True
                        break

            if not assigned:
                for ts_idx in valid_timeslot_map["Theatre"]:
                    ts = timeslots[ts_idx]
                    if ts_idx not in used_timeslots:
                        timetable[course["id"]]["lectures"].append({
                            "room_id": random.choice(preferred_rooms)["id"],
                            "timeslot_id": ts_idx,
                            "timeslot_day": ts["day"],
                            "timeslot_slot": ts["slot"],
                        })
                        used_timeslots.add(ts_idx)
                        break

    return timetable

# --- FITNESS FUNCTION ---
def fitness(timetable, courses, teachers, rooms, timeslots, max_hours, valid_timeslot_map):
    score = 1000
    teacher_day_hours = defaultdict(lambda: defaultdict(int))
    teacher_schedule = defaultdict(lambda: defaultdict(list))
    room_usage = defaultdict(set)
    room_map = {room["id"]: room for room in rooms}
    teacher_day_lecture = defaultdict(lambda: defaultdict(bool))
    teacher_day_lab_subjects = defaultdict(lambda: defaultdict(set))

    for course in courses:
        course_entry = timetable.get(course["id"])
        teacher_id = course.get("teacher_id")

        if not course_entry or teacher_id is None:
            score -= 50
            continue

        for lecture in course_entry.get("lectures", []):
            timeslot = timeslots[lecture["timeslot_id"]]
            room = room_map[lecture["room_id"]]
            day = timeslot["day"]
            time_range = timeslot["slot"]
            slot_key = f"{day}-{time_range}"

            if slot_key in room_usage[room["id"]]:
                score -= 20
            room_usage[room["id"]].add(slot_key)

            if lecture["timeslot_id"] not in valid_timeslot_map.get(room["type"], []):
                score -= 25

            teacher_day_hours[teacher_id][day] += 1
            if teacher_day_hours[teacher_id][day] > max_hours:
                score -= 10

            if teacher_day_lecture[teacher_id][day]:
                score -= 100
            else:
                teacher_day_lecture[teacher_id][day] = True

            start_str, end_str = time_range.split(" - ")
            start = datetime.strptime(start_str.strip(), "%H:%M").time()
            end = datetime.strptime(end_str.strip(), "%H:%M").time()
            teacher_schedule[teacher_id][day].append((start, end))

        for lab in course_entry.get("labs", []):
            ts1, ts2 = lab["timeslot_ids"]
            room = room_map[lab["room_id"]]
            day = lab["timeslot_day"]
            slot1 = timeslots[ts1]["slot"]
            slot2 = timeslots[ts2]["slot"]

            slot_key1 = f"{day}-{slot1}"
            slot_key2 = f"{day}-{slot2}"

            if slot_key1 in room_usage[room["id"]] or slot_key2 in room_usage[room["id"]]:
                score -= 20
            room_usage[room["id"]].add(slot_key1)
            room_usage[room["id"]].add(slot_key2)

            if ts1 not in valid_timeslot_map.get(room["type"], []) or ts2 not in valid_timeslot_map.get(room["type"], []):
                score -= 25

            teacher_day_hours[teacher_id][day] += 2
            if teacher_day_hours[teacher_id][day] > max_hours:
                score -= 10

            if course["id"] in teacher_day_lab_subjects[teacher_id][day]:
                score -= 80
            else:
                teacher_day_lab_subjects[teacher_id][day].add(course["id"])

            start1, _ = slot1.split(" - ")
            _, end2 = slot2.split(" - ")
            start = datetime.strptime(start1.strip(), "%H:%M").time()
            end = datetime.strptime(end2.strip(), "%H:%M").time()
            teacher_schedule[teacher_id][day].append((start, end))

    for schedule in teacher_schedule.values():
        for times in schedule.values():
            sorted_times = sorted(times)
            for i in range(len(sorted_times) - 1):
                end_current = datetime.combine(datetime.today(), sorted_times[i][1])
                start_next = datetime.combine(datetime.today(), sorted_times[i + 1][0])
                if (start_next - end_current) <= timedelta(minutes=10):
                    score -= 20

    return score

# --- GA UTILITIES ---
def select(population, scores):
    total = sum(scores)
    if total <= 0:
        return random.choice(population)
    return random.choices(population, weights=[s / total for s in scores], k=1)[0]

def crossover(p1, p2):
    return {k: random.choice([p1.get(k), p2.get(k)]) for k in p1.keys()}

def mutate(timetable, courses, rooms, teachers, valid_timeslot_map, timeslots):
    room_map = {room["id"]: room for room in rooms}

    for course in courses:
        cid = course["id"]
        if cid not in timetable or random.random() > MUTATION_RATE:
            continue

        entry = timetable[cid]

        for lecture in entry.get("lectures", []):
            room = room_map[lecture["room_id"]]
            valid_ts = valid_timeslot_map.get(room["type"], []) or list(range(len(timeslots)))
            lecture["timeslot_id"] = random.choice(valid_ts)

# --- FORMAT FINAL OUTPUT ---
def format_result_for_display(timetable, courses, teachers, rooms, timeslots):
    room_map = {r["id"]: r["name"] for r in rooms}
    timeslot_map = {ts["id"]: ts["slot"] for ts in timeslots}

    formatted_result = []

    for course in courses:
        cid = course["id"]
        subject_name = course["name"]

        if cid in timetable:
            for lecture in timetable[cid]["lectures"]:
                timeslot = timeslots[lecture["timeslot_id"]]
                formatted_result.append({
                    "subject": subject_name,
                    "type": "Lecture",
                    "room": room_map.get(lecture["room_id"], f"Room {lecture['room_id']}"),  # Use name
                    "day": timeslot["day"],
                    "time": timeslot["slot"],
                    "teacher": course["teacher_id"],
                })

            for lab in timetable[cid]["labs"]:
                formatted_result.append({
                    "subject": subject_name,
                    "type": "Lab",
                    "room": room_map.get(lab["room_id"], f"Room {lab['room_id']}"),  # Use name
                    "day": lab["timeslot_day"],
                    "time": lab["combined_slot"],
                    "teacher": course["teacher_id"],
                })

    return formatted_result


# --- POST TO DJANGO ---
def post_timetable_to_django_api(formatted_result):
    url = "http://localhost:8000/api/timetable/save/"
    response = requests.post(url, json=formatted_result)
    print("Response:", response.json())
