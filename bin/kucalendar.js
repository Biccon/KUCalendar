"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _request = require("request");

var _request2 = _interopRequireDefault(_request);

var _cheerio = require("cheerio");

var _cheerio2 = _interopRequireDefault(_cheerio);

var _md = require("md5");

var _md2 = _interopRequireDefault(_md);

var _nodeZip = require("node-zip");

var _nodeZip2 = _interopRequireDefault(_nodeZip);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var makeCalendar = function makeCalendar(year) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { filename: "", zipped: false };

	var filename = options.filename ? options.filename : "\uAC74\uAD6D\uB300\uD559\uAD50 " + year + "\uB144\uB3C4 \uD559\uC0AC\uC77C\uC815";
	var headers = {
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36"
	};
	var opts = {
		uri: "http://www.konkuk.ac.kr/do/MessageBoard/HaksaArticleList.do",
		method: "POST",
		encoding: null,
		form: { forum: 11543, year: year },
		headers: headers
	};
	(0, _request2.default)(opts, function (error, response, body) {
		var $ = _cheerio2.default.load(body);

		var VCALENDAR = "BEGIN:VCALENDAR\n";
		VCALENDAR += "VERSION:2.0\n";
		VCALENDAR += "PRODID:Biccon//KU Calendar\n";
		VCALENDAR += "X-WR-CALNAME:" + filename + "\n";
		VCALENDAR += "CALSCALE:GREGORIAN\n";
		VCALENDAR += "BEGIN:VTIMEZONE\n";
		VCALENDAR += "TZID:Asia/Seoul\n";
		VCALENDAR += "BEGIN:STANDARD\n";
		VCALENDAR += "DTSTART:19700101T000000\n";
		VCALENDAR += "TZNAME:GMT+09:00\n";
		VCALENDAR += "TZOFFSETFROM:+0900\n";
		VCALENDAR += "TZOFFSETTO:+0900\n";
		VCALENDAR += "END:STANDARD\n";
		VCALENDAR += "END:VTIMEZONE\n";

		var calendars = $(".calendar_area");
		calendars.each(function (i, ele) {
			var _$$find$text$split = $(ele).find(".mon").text().split("."),
			    _$$find$text$split2 = _slicedToArray(_$$find$text$split, 2),
			    year = _$$find$text$split2[0],
			    month = _$$find$text$split2[1];

			var details = $(ele).find(".detail_calendar > dl");
			details.each(function (i2, ele2) {
				var period = $(ele2).find("dt").text().trim().match(/(\d+\.\d+)/g);
				var summary = $(ele2).find("dd").text().trim();

				var startdate = period[0].replace(".", "");
				var enddate = period[1] ? period[1].replace(".", "") : startdate;

				var isNextyear = Number.parseInt(startdate) - Number.parseInt(enddate) > 0;

				startdate = year + startdate;
				enddate = isNextyear ? Number.parseInt(year) + 1 + enddate : year + enddate;

				var VEVENT = "BEGIN:VEVENT\n";
				VEVENT += "SEQUENCE:0\n";
				VEVENT += "CLASS:PUBLIC\n";
				VEVENT += "TRANSP:OPAQUE\n";
				VEVENT += "DTSTART:" + startdate + "\n";
				VEVENT += "DTEND:" + enddate + "\n";
				VEVENT += "SUMMARY:" + summary + "\n";
				VEVENT += "LOCATION:Konkuk University\n";
				VEVENT += "CREATED:" + new Date().toISOString() + "\n";
				VEVENT += "UID:" + (0, _md2.default)(startdate + enddate + summary) + "@konkuk\n";
				VEVENT += "END:VEVENT\n";

				VCALENDAR += VEVENT;
			});
		});
		VCALENDAR += "END:VCALENDAR\n";
		if (options.zipped == true) {
			var zip = (0, _nodeZip2.default)();
			zip.file(filename + ".ics", VCALENDAR);
			var data = zip.generate({
				base64: false,
				compression: "DEFLATE"
			});
			_fs2.default.writeFileSync(filename + ".zip", data, "binary");
		} else {
			_fs2.default.writeFileSync(filename + ".ics", VCALENDAR);
		}
	});
};

exports.default = makeCalendar;
