import request from "request";
import cheerio from "cheerio";
import md5 from "md5";
import node_zip from "node-zip";
import fs from "fs";

const makeCalendar = (year, options = { filename: "", zipped: false }) => {
	const filename = options.filename
		? options.filename
		: `건국대학교 ${year}년도 학사일정`;
	const headers = {
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36"
	};
	const opts = {
		uri: "http://www.konkuk.ac.kr/do/MessageBoard/HaksaArticleList.do",
		method: "POST",
		encoding: null,
		form: { forum: 11543, year },
		headers
	};
	request(opts, (error, response, body) => {
		const $ = cheerio.load(body);

		let VCALENDAR = "BEGIN:VCALENDAR\n";
		VCALENDAR += "VERSION:2.0\n";
		VCALENDAR += "PRODID:Biccon//KU Calendar\n";
		VCALENDAR += `X-WR-CALNAME:${filename}\n`;
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

		const calendars = $(".calendar_area");
		calendars.each((i, ele) => {
			const [year, month] = $(ele)
				.find(".mon")
				.text()
				.split(".");
			const details = $(ele).find(".detail_calendar > dl");
			details.each((i2, ele2) => {
				const period = $(ele2)
					.find("dt")
					.text()
					.trim()
					.match(/(\d+\.\d+)/g);
				const summary = $(ele2)
					.find("dd")
					.text()
					.trim();

				let startdate = period[0].replace(".", "");
				let enddate = period[1]
					? period[1].replace(".", "")
					: startdate;

				const isNextyear =
					Number.parseInt(startdate) - Number.parseInt(enddate) > 0;

				startdate = year + startdate;
				enddate = isNextyear
					? Number.parseInt(year) + 1 + enddate
					: year + enddate;

				let VEVENT = "BEGIN:VEVENT\n";
				VEVENT += `SEQUENCE:0\n`;
				VEVENT += `CLASS:PUBLIC\n`;
				VEVENT += `TRANSP:OPAQUE\n`;
				VEVENT += `DTSTART:${startdate}\n`;
				VEVENT += `DTEND:${enddate}\n`;
				VEVENT += `SUMMARY:${summary}\n`;
				VEVENT += `LOCATION:Konkuk University\n`;
				VEVENT += `CREATED:${new Date().toISOString()}\n`;
				VEVENT += `UID:${md5(startdate + enddate + summary)}@konkuk\n`;
				VEVENT += `END:VEVENT\n`;

				VCALENDAR += VEVENT;
			});
		});
		VCALENDAR += "END:VCALENDAR\n";
		if (options.zipped == true) {
			const zip = node_zip();
			zip.file(`${filename}.ics`, VCALENDAR);
			const data = zip.generate({
				base64: false,
				compression: "DEFLATE"
			});
			fs.writeFileSync(`${filename}.zip`, data, "binary");
		} else {
			fs.writeFileSync(`${filename}.ics`, VCALENDAR);
		}
	});
};

export default makeCalendar;
