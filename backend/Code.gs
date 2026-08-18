/**
 * 알바계산기 백엔드 — Google Apps Script
 *
 * ✅ 2026-08-19 확보한 **원본 코드** (편집기에서 그대로 복사)
 *    그 전까지는 동작을 보고 재구성한 추정본만 있었습니다.
 *
 * ── 어디에 있나 ──────────────────────────────────────────────
 *   스프레드시트  "제목 없는 스프레드시트"
 *      ID        16bUjNBn9A6j9C6VMbAJenUDBTFi2bpyiSvjk6l1bMZc
 *   스크립트      "제목 없는 프로젝트" (위 시트에 바인딩됨)
 *      ID        1x7Jbk9p_ltOf498gLsfxlvpP73WficvgbQFYkOWrQpdUj71aaiJBhR3i
 *      편집기    https://script.google.com/d/1x7Jbk9p_ltOf498gLsfxlvpP73WficvgbQFYkOWrQpdUj71aaiJBhR3i/edit
 *   배포 URL      .../AKfycbxGpa_Zyok-eV63Otf3C-WpVpiOt8gb4_W18g097IEL9iCUdlBrhMuNltU49u_Cuy5zNQ/exec
 *
 * ── 저장 구조 ────────────────────────────────────────────────
 *   탭 "알바비데이터"
 *     A1  전체 데이터 JSON 한 덩어리
 *     B1  마지막 저장 시각
 *
 *   컬럼으로 쪼개지 않습니다. 앱이 보낸 것을 통째로 넣고 통째로 꺼냅니다.
 *   그래서 앱에 새 필드(terms · startYM 등)를 추가해도 이 코드를 안 고쳐도 됐습니다.
 *
 * ── 데이터 모양 ──────────────────────────────────────────────
 *   {
 *     branches   : [{id, name}]
 *     workers    : [{id, name, branchId, hourlyWage, workDays, fixed,
 *                    startYM, resigned, resignDate,
 *                    terms:[{from, hourlyWage, fixed, days:{요일:{start,end}}}]}]
 *     exceptions : [{id, wid, date, type, hours, startTime, endTime}]
 *     payments   : [{id, wid, ym, paidAt, gross, net, basePay, juHyu}]
 *     summaryExclude : [워커id]
 *   }
 *
 *   급여 계산은 앱(index.html)이 합니다. 이 백엔드는 계산하지 않습니다.
 *   payments 의 금액은 앱이 "지급완료" 시점에 확정한 값이고,
 *   손익계산서 GAS 는 그 gross 를 그대로 인건비로 씁니다.
 *
 * ── 누가 쓰나 ────────────────────────────────────────────────
 *   알바계산기 앱   POST 저장 / GET 조회
 *   손익계산서 GAS  GET 으로 읽어 인건비 기록 (syncLaborCosts)
 *
 * ── ⚠️ 알려진 약점 (원본 그대로 두고 기록만 함) ──────────────
 *   ① 동시 저장 보호가 없음
 *      폰과 PC에서 거의 동시에 저장하면 나중 것이 앞 것을 덮어써 유실됩니다.
 *   ② 들어온 데이터를 검사하지 않음
 *      빈 값이나 깨진 JSON이 와도 그대로 A1 을 덮어씁니다. 전체가 날아갈 수 있습니다.
 *   ③ 되돌릴 방법이 A1 하나뿐
 *      구글 시트 버전 기록으로만 복구 가능합니다 (30일).
 *
 *   지금까지 문제가 없었던 건 혼자 쓰셨기 때문입니다.
 *   고치려면 backend/README.md 의 "개선안" 을 참고하세요.
 *   ※ 원본을 보존하려고 일부러 손대지 않았습니다.
 */

const SHEET_NAME = '알바비데이터';

function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getRange('A1').getValue();
    const result = data ? JSON.parse(data) : {};
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    sheet.getRange('A1').setValue(JSON.stringify(payload));
    sheet.getRange('B1').setValue(new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, saved: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.setColumnWidth(1, 800);
    sheet.setColumnWidth(2, 200);
  }
  return sheet;
}
