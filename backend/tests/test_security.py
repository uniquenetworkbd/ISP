from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hash_round_trip() -> None:
    password = "Strong-test-password-123!"
    password_hash = hash_password(password)
    assert password_hash != password
    assert verify_password(password, password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_access_token_round_trip() -> None:
    token = create_access_token(42, "noc-admin", ["admin", "operator"])
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["username"] == "noc-admin"
    assert payload["roles"] == ["admin", "operator"]
