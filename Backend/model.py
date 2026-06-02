import pandas as pd
import json
import seaborn as sns
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import lightgbm as lgb
import sqlite3

connector = sqlite3.connect("Data/internships.db")

data = pd.read_sql_query("SELECT * FROM internships", connector)

connector.close()

data['Sector_raw'] = data['Sector'].astype(str)
data['location_raw'] = data['location'].astype(str)



data['stipend'] = data['stipend'].apply(lambda x: '0' if 'Unpaid' in str(x) else x)
data['stipend'] = data['stipend'].str.replace("/month", "").str.replace("lump sum", "").str.replace("₹", "")

data['Other Benifits'] = data['stipend'].str.split('+').apply(lambda x: x[-1].strip() if len(x) > 1 else None)
data['stipend'] = data['stipend'].str.split('+').str[0].str.strip()

data['min stipend'] = data['stipend'].str.split("-").str[0].str.extract(r'([\d,]+)', expand=False).str.replace(",", "")
data['max stipend'] = data['stipend'].str.split("-").str[-1].str.extract(r'([\d,]+)', expand=False).str.replace(",", "")
data[['min stipend','max stipend']] = data[['min stipend','max stipend']].apply(pd.to_numeric, errors='coerce')


def weeks_to_months(duration):
    if isinstance(duration, str) and 'Weeks' in duration:
        weeks = int(duration.split()[0])
        return weeks / 4.33
    try:
        return float(duration.split()[0])
    except:
        return None

data['duration'] = data['duration'].apply(weeks_to_months)


categorical_cols = ['Sector', 'location']
encoders = {col: LabelEncoder().fit(data[col].astype(str)) for col in categorical_cols}
for col, encoder in encoders.items():
    data[col] = encoder.transform(data[col].astype(str))

if "applied" in data.columns:

    print("Using real user-applied labels...")
    data['label'] = data['applied']
else:

    print("Using simulated stipend+duration labels...")
    median_stipend = data['max stipend'].median()
    median_duration = data['duration'].median()
    data['label'] = ((data['max stipend'] >= median_stipend) & 
                     (data['duration'] >= median_duration)).astype(int)

features = ['Sector', 'location', 'min stipend', 'max stipend', 'duration']
X = data[features].fillna(0)
y = data['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = lgb.LGBMClassifier(num_leaves=31, learning_rate=0.05, n_estimators=100)
model.fit(X_train, y_train)


def predict_internships(skills, sector, location):

    #Filter by sector and location of interes
    filtered_data = data[
        (data['Sector_raw'].str.contains(sector, case=False, na=False)) &
        (data['location_raw'].str.contains(location, case=False, na=False))
    ].copy()

    if filtered_data.empty:
        filtered_data = data.copy()

    #Score internships
    filtered_data['score'] = model.predict_proba(filtered_data[features].fillna(0))[:, 1]
    top_internships = filtered_data.sort_values(by='score', ascending=False).head(3)

    # Use original text values for output
    columns_to_show = ['company_name', 'Sector_raw', 'location_raw', 'min stipend', 'max stipend', 'duration', 'score']
    
    mapping = {
        'company_name': 'Company',
        'Sector_raw': 'Sector',
        'location_raw': 'Location',
        'min stipend': 'Min Stipend',
        'max stipend': 'Max Stipend',
        'duration': 'Duration (months)',
        'score': 'Match Score'
    }
    return top_internships[columns_to_show].rename(columns=mapping).to_dict(orient='records')




