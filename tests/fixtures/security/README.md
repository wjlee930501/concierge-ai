# Security scan fixtures

이 디렉토리는 secret scan helper 테스트를 위한 test-only fixture 전용 경로다.

- production secret, webhook URL, API key 실값을 두지 않는다.
- `scripts/security-scan.mjs`의 기본 project scan은 `tests/fixtures/security/dummy-secret-markers.fixture.txt`를 명시적으로 제외한다. fixture 파일명을 바꾸면 scanner 제외 목록도 함께 갱신한다.
- 테스트에서 필요한 탐지 문자열은 메모리 문자열 또는 명백한 dummy marker만 사용한다.
