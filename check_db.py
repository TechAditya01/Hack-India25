import psycopg2
from psycopg2.extras import RealDictCursor

# Database configuration
DATABASE_URL = "postgresql://hackindia_652w_user:dx8XzlXYo01FhlVy5pBqg4ZJcgT1EWIA@dpg-cvmcpq15pdvs73f1vn1g-a.singapore-postgres.render.com/hackindia_652w"

def check_emails():
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query the emails table
        cur.execute("SELECT * FROM emails;")
        rows = cur.fetchall()
        
        print("\nEmails in database:")
        print("------------------")
        if rows:
            for row in rows:
                print(f"Email: {row['email']}")
                print(f"Created at: {row['created_at']}")
                print("------------------")
        else:
            print("No emails found in the database.")
            
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_emails() 