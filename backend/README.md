# 알바계산기 백엔드

## 저장 구조 — 2026-08-18 드라이브에서 역추적해 확인

```
스프레드시트  "제목 없는 스프레드시트"
   ID        16bUjNBn9A6j9C6VMbAJenUDBTFi2bpyiSvjk6l1bMZc
   탭        알바비데이터
   A1        전체 데이터 JSON 한 덩어리
   B1        마지막 저장 시각
```

**시트 컬럼으로 나누지 않고 JSON 통째로 한 칸에** 넣습니다.
그래서 앱에 새 필드(`terms`, `startYM` 등)를 추가해도 백엔드를 안 고쳐도 됐습니다.

## 바인딩된 Apps Script

```
제목      제목 없는 프로젝트
ID        1x7Jbk9p_ltOf498gLsfxlvpP73WficvgbQFYkOWrQpdUj71aaiJBhR3i
편집기    https://script.google.com/d/1x7Jbk9p_ltOf498gLsfxlvpP73WficvgbQFYkOWrQpdUj71aaiJBhR3i/edit
배포 URL  https://script.google.com/macros/s/AKfycbxGpa_Zyok-eV63Otf3C-WpVpiOt8gb4_W18g097IEL9iCUdlBrhMuNltU49u_Cuy5zNQ/exec
```

스프레드시트(08:06:27)와 스크립트(08:06:54)가 27초 차이로 만들어졌습니다.
시트에 바인딩된 스크립트라 드라이브 목록에 따로 안 잡혀서 못 찾고 있었습니다.

## 이 폴더의 파일

| 파일 | 내용 |
|---|---|
| `Code.gs` | **복원한 백엔드 코드.** 실제 원본이 아니라 동작을 보고 재구성한 것 |
| `data-backup-2026-08-18.json` | 그날의 전체 데이터 스냅샷 |

## ⚠️ Code.gs 는 재구성본입니다

원본을 못 구해서 **관측된 동작에 맞춰 다시 쓴 것**입니다.

```
확인된 것    저장 위치 · 탭 이름 · JSON 통짜 저장 · 응답 형식 {ok, data}
추측한 것    함수 이름 · 오류 처리 · 잠금 처리 방식
```

동작은 같지만 원본과 글자가 같지는 않습니다.
**원본을 확보하면 이 파일을 덮어쓰세요.**

```
편집기 열기 → Ctrl+A → Ctrl+C → 이 파일에 붙여넣기
```

## 데이터가 날아갔을 때

1. `data-backup-*.json` 을 엽니다
2. 시트 `알바비데이터` 탭 A1 에 통째로 붙여넣습니다
3. 앱을 새로고침합니다

앱은 A1 의 JSON 을 그대로 읽으므로 이것만으로 복구됩니다.
