const { mwn } = require('mwn');
const axios = require('axios').default;
const util = require('./util.js');
require('dotenv').config();
const wwregexes = [/confirmed\s*=\s*(\d+)\n/,/deaths\s*=\s*(\d+)\n/,/time\s*=\s*(\d{2}:\d{2}) UTC\n/,/date\s*=\s*(\d{1,2}) \w{3,9} \d{4}\n/,/date\s*=\s*\d{1,2} (\w+) \d{4}\n/,/date\s*=\s*\d{1,2} \w{3,9} (\d{4})\n/];

async function getSource(title) {
    return await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
            action: 'query',
            prop: 'revisions',
            titles: title,
            rvslots: '*',
            rvprop: 'content',
            format: 'json',
            formatversion: 2,
        },
    });
}

async function getCasesChart(region) {
    return await getSource(`Template:COVID-19 pandemic data/${region} medical cases chart`);
}

(async function() {
    const bot = await mwn.init({
        apiUrl: process.env.APIURL,
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
        userAgent: 'h78c67c-bot/1.0.0 (User h78c67c) mwn/0.11.0',
    });
    await worldwide(bot);
})();

async function worldwide(bot){
    const res = await getSource('Template:Cases in the COVID-19 pandemic');
    
    const content = res.data.query.pages[0].revisions[0].slots.main.content;
    let paramVals = [];
    try {
        wwregexes.forEach(regex => paramVals.push(content.match(regex)[1]));
    } catch(e) {
        return console.error('Error: Malformed template source (ww).');
    }
    const output = 
`{{武漢肺炎病例總數/core
 |confirmed   = ${paramVals[0]}
 |deaths      = ${paramVals[1]}
 |date        = ${paramVals[5]}年${util.enMonthsToHani(paramVals[4])}月${paramVals[3]}號
 |time        = ${paramVals[2]} UTC
 |type        = {{{1}}}
}}<!-- *** For consistency, simplicity and credibility, we kindly ask to source ONLY from Johns Hopkins University.
 *** Please refer to the Talk Page for more information.
-->{{#ifeq:{{{editlink}}}|yes|{{Edit sup|Template:武漢肺炎病例總數}}|}}{{#ifeq:{{{ref}}}|no||<!-- Reference: --><ref name="JHU_ticker">{{cite web |url=https://gisanddata.maps.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6 |title=COVID-19 Dashboard by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University (JHU) |publisher=[[莊鶴堅斯大學]] |website=[[ArcGIS]] |access-date=${paramVals[5]}年${util.enMonthsToHani(paramVals[4])}月${paramVals[3]}號}}</ref>}}<noinclude>
{{documentation}}
[[Category:武漢肺炎疫情模]]
</noinclude>
`;
    await bot.save('Template:武漢肺炎病例總數', output, '更新').catch(e => console.error(`Error saving page: ${e}`));
    console.log('ww end');
}