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
| `Code.gs` | ✅ **원본 코드** (2026-08-19 확보) |
| `data-backup-2026-08-18.json` | 데이터 스냅샷 |

## 코드는 아주 단순합니다

함수 3개가 전부입니다.

```
doGet()            A1 을 읽어 그대로 돌려줌
doPost()           받은 것을 그대로 A1 에 씀
getOrCreateSheet() 탭이 없으면 만듦
```

**계산도, 검사도, 가공도 하지 않습니다.** 앱이 보낸 JSON을 한 칸에 넣고 꺼내는 게 전부입니다.
그래서 앱에 새 필드를 추가해도 이 코드를 안 고쳐도 됐습니다.

## ⚠️ 알려진 약점 — 원본 보존을 위해 안 고쳤습니다

| 약점 | 무슨 일이 생기나 |
|---|---|
| 동시 저장 보호 없음 | 폰과 PC에서 거의 동시에 저장하면 나중 것이 앞 것을 덮어써 유실 |
| 들어온 데이터 무검사 | 빈 값·깨진 JSON이 와도 그대로 덮어씀. 전체가 날아갈 수 있음 |
| 되돌릴 곳이 A1 하나 | 구글 시트 버전 기록으로만 복구 가능 (30일) |

혼자 쓰시는 동안은 문제가 없었습니다. **여러 기기에서 동시에 쓰기 시작하면 위험합니다.**

### 개선안 (필요해지면 적용)

```javascript
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(20000)) return json({ ok:false, error:'다른 저장이 진행 중' });

    const payload = JSON.parse(e.postData.contents);

    // 빈 껍데기가 기존 데이터를 지우는 것을 막는다
    if (!payload || !Array.isArray(payload.workers)) throw new Error('데이터가 비어 있음');

    ... 기존 저장 ...
  } finally { lock.releaseLock(); }
}
```

두 줄이면 사고 두 종류가 막힙니다. **다만 지금 잘 돌고 있으니 급하지 않습니다.**

## 데이터가 날아갔을 때

1. `data-backup-*.json` 을 엽니다
2. 시트 `알바비데이터` 탭 A1 에 통째로 붙여넣습니다
3. 앱을 새로고침합니다

앱은 A1 의 JSON 을 그대로 읽으므로 이것만으로 복구됩니다.
