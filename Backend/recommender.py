from model import predict_internships

def get_recommendations(skills, sector, location):
    return predict_internships(skills, sector, location)