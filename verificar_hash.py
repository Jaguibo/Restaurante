import hashlib

password = "1234"
hash_generado = hashlib.sha256(password.encode()).hexdigest()

print(f"SHA-256 de '{password}' es:\n{hash_generado}")
