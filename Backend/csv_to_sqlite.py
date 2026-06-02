import pandas as pd
import sqlite3

"""
Work Flow:
1. Read the CSV file using pandas.
2. Creating a connection to sqlite database naming it as "internships.db".
3. Creating tables in the database to inset data from the CSV file.
"""

#Step 1:

data = pd.read_csv("Data/internship.csv", 
                   encoding="latin-1"
                   )

#Step 2:
connection = sqlite3.connect("Data/internships.db")

#Step 3:

data.to_sql("internships", connection, if_exists="replace", index=False)


connection.close()

print("Data inserted successfully into the database.")