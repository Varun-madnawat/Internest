import sqlite3
import re

def extract_skills_from_db():
    connection = sqlite3.connect(r"data/internships.db")

    cursor  = connection.cursor()

    cursor.execute("SELECT skills FROM internships")
    
    skills_data = set()
    
    for row in cursor.fetchall():
        
        if row[0]:
            skills = row[0].split(",")
            
            
        for skill in skills:
            skills_data.add(skill.strip().lower())
            
    connection.close()
    
    return skills_data



def get_user_skills(text):
    
    text = text.lower()
    
    skills_list = extract_skills_from_db()
    
    found_skills = set()
    
    for skill in skills_list:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text):
            found_skills.add(skill)
            
            
    return found_skills
