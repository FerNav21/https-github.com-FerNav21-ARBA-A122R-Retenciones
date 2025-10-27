curl -X POST https://idp.test.arba.gov.ar/realms/ARBA/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=A122RServicios" \
  -d "client_secret=44cqahkhERKtkkDGmcqrPApCMtez3Xxt" \
  -d "username=20304050601" \
  -d "password=CIT_SECRETA" \
  -d "scope=openid"