import sqlite3

conn = sqlite3.connect('feedaz.db')
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA table_info(feedbacks)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'tipo_feedback' not in columns:
        print("Adicionando coluna tipo_feedback...")
        cursor.execute("ALTER TABLE feedbacks ADD COLUMN tipo_feedback VARCHAR DEFAULT 'MENSAL'")
        cursor.execute("UPDATE feedbacks SET tipo_feedback = 'MENSAL' WHERE tipo_feedback IS NULL")
        conn.commit()
        print("Coluna tipo_feedback adicionada!")
    else:
        print("Coluna tipo_feedback ja existe")
    
    if 'motivo_feedback' not in columns:
        print("Adicionando coluna motivo_feedback...")
        cursor.execute("ALTER TABLE feedbacks ADD COLUMN motivo_feedback TEXT")
        conn.commit()
        print("Coluna motivo_feedback adicionada!")
    else:
        print("Coluna motivo_feedback ja existe")
    
    if 'descricao_feedback' not in columns:
        print("Adicionando coluna descricao_feedback...")
        cursor.execute("ALTER TABLE feedbacks ADD COLUMN descricao_feedback TEXT")
        conn.commit()
        print("Coluna descricao_feedback adicionada!")
    else:
        print("Coluna descricao_feedback ja existe")
        
except Exception as e:
    print(f"Erro: {e}")
    conn.rollback()
finally:
    conn.close()

print("\nMigracao concluida!")
