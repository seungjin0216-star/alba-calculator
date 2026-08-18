/**
 * 알바계산기 백엔드 — Google Apps Script
 *
 * ⚠️ 이것은 **재구성본**입니다 (2026-08-18)
 *
 *    원본 코드를 어디서도 찾지 못해, 실제 동작을 관측해서 다시 썼습니다.
 *      확인된 것 : 저장 위치 · 탭 이름 · JSON 통짜 저장 · 응답 형식
 *      추측한 것 : 함수 이름 · 오류 처리 · 잠금 방식
 *    동작은 같지만 원본과 글자가 같지는 않습니다.
 *    원본을 확보하면 이 파일을 덮어쓰세요.
 *
 * ── 어디에 있나 ──────────────────────────────────────────────
 *   스프레드시트  "제목 없는 스프레드시트"
 *      ID        16bUjNBn9A6j9C6VMbAJenUDBTFi2bpyiSvjk6l1bMZc
 *   스크립트      "제목 없는 프로젝트" (위 시트에 바인딩됨)
 *      ID        1x7Jbk9p_ltOf498gLsfxlvpP73WficvgbQFYkOWrQpdUj71aaiJBhR3i
 *   배포 URL      .../AKfycbxGpa_Zyok-eV63Otf3C-WpVpiOt8gb4_W18g097IEL9iCUdlBrhMuNltU49u_Cuy5zNQ/exec
 *
 * ── 저장 구조 ────────────────────────────────────────────────
 *   탭 "알바비데이터"
 *     A1  전체 데이터 JSON 한 덩어리
 *     B1  마지막 저장 시각
 *
 *   컬럼으로 쪼개지 않습니다. 그래서 앱에 새 필드를 추가해도
 *   백엔드를 고칠 필요가 없습니다. (terms · startYM 등이 그렇게 들어갔습니다)
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
 *   payments 의 금액은 **앱이 계산해서 보낸 확정값**입니다.
 *   백엔드는 계산하지 않습니다. 손익계산서도 이 gross 를 그대로 씁니다.
 *
 * ── 누가 쓰나 ────────────────────────────────────────────────
 *   알바계산기 앱   POST 로 저장 / GET 으로 조회
 *   손익계산서 GAS  GET 으로 읽어 인건비를 기록 (syncLaborCosts)
 */

var SHEET_NAME = '알바비데이터';

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange('A1').setValue('');
    sh.getRange('B1').setValue('');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 앱이 데이터를 읽어간다
 *   응답 { ok: true, data: {...} }
 */
function doGet(e) {
  try {
    var raw = String(sheet_().getRange('A1').getValue() || '').trim();
    if (!raw) return json_({ ok: true, data: { branches: [], workers: [], exceptions: [], payments: [] } });
    return json_({ ok: true, data: JSON.parse(raw) });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

/**
 * 앱이 데이터를 저장한다
 *   앱은 Content-Type: text/plain 으로 보낸다 (CORS 사전 요청 회피)
 *   본문은 상태 전체다. 부분 갱신이 아니라 통째로 덮어쓴다.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // 동시에 두 기기에서 저장하면 하나가 날아간다. 순서를 강제한다.
    if (!lock.tryLock(20000)) return json_({ ok: false, error: '다른 저장이 진행 중입니다' });

    var body = JSON.parse(e.postData.contents);

    // 최소 검증 — 빈 껍데기가 들어와 기존 데이터를 지우는 것을 막는다
    if (!body || typeof body !== 'object') throw new Error('본문이 비어 있습니다');
    if (!Array.isArray(body.workers)) throw new Error('workers 가 없습니다');

    var sh = sheet_();
    sh.getRange('A1').setValue(JSON.stringify(body));
    sh.getRange('B1').setValue(new Date());
    SpreadsheetApp.flush();

    return json_({ ok: true, saved: body.workers.length });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

/** 진단 — 지금 무엇이 들어 있나 */
function checkData() {
  var raw = String(sheet_().getRange('A1').getValue() || '').trim();
  if (!raw) { Logger.log('데이터 없음'); return; }
  var d = JSON.parse(raw);
  Logger.log('지점 ' + (d.branches || []).length +
             ' · 알바 ' + (d.workers || []).length +
             ' · 예외 ' + (d.exceptions || []).length +
             ' · 지급 ' + (d.payments || []).length);
  Logger.log('마지막 저장: ' + sheet_().getRange('B1').getDisplayValue());
  Logger.log('크기: ' + raw.length.toLocaleString() + '자');

  (d.branches || []).forEach(function (b) {
    var n = (d.workers || []).filter(function (w) { return w.branchId === b.id; }).length;
    Logger.log('  ' + b.name + '  ' + n + '명');
  });
}

/**
 * 백업 — 지금 데이터를 로그에 통째로 찍는다
 *   복사해서 backend/data-backup-YYYY-MM-DD.json 에 저장할 것
 */
function dumpForBackup() {
  Logger.log(String(sheet_().getRange('A1').getValue() || ''));
}
