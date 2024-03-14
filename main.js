import { upload } from './spaces.js';
import private_config from './private.js';

const { cdn_id, token, do_spaces } = private_config;
// source: https://docs.digitalocean.com/reference/api/api-try-it-now/#/CDN%20Endpoints/cdn_purge_cache
const purge_endpoint = `https://api.digitalocean.com/v2/cdn/endpoints/${cdn_id}/cache`;
// header "origin" ignores cdn purge (any domain can be used)
const headers = { 'origin': 'https://digitalocean.com' };
const sleep_duration_sec = 2;

const main = async () => {
    let content = genID();
    let test_file_name = content + '.txt';
    log(`generate content: "${content}"`);
    log(`upload the content to DO Spaces`);
    
    const checkFiles = async (content) => {
        console.log('');
        log('CHECKING FILES:');
        log('fetch uploaded content from origin endpoint');
        let file_url = `https://${do_spaces.Bucket}.${do_spaces.region}.digitaloceanspaces.com/${test_file_name}`;
        let fetched_content = await load(file_url);
        log(`"${content}" (expected) == "${fetched_content}" (DO Spaces): ${ (content == fetched_content).toString().toUpperCase() }`);

        log('fetch uploaded content from CDN endpoint (without header "origin")');
        file_url = `https://${do_spaces.Bucket}.${do_spaces.region}.cdn.digitaloceanspaces.com/${test_file_name}`;
        fetched_content = await load(file_url);
        log(`"${content}" (expected) == "${fetched_content}" (DO Spaces CDN): ${ (content == fetched_content).toString().toUpperCase() }`);

        log('fetch uploaded content from CDN endpoint (with Header "origin")');
        file_url = `https://${do_spaces.Bucket}.${do_spaces.region}.cdn.digitaloceanspaces.com/${test_file_name}`;
        fetched_content = await load(file_url, { headers });
        log(`"${content}" (expected) == "${fetched_content}" (DO Spaces CDN): ${ (content == fetched_content).toString().toUpperCase() }`);
    };

    // upload initial content to a new file (file_name == content)
    await upload(test_file_name, content);
    await sleep(sleep_duration_sec);
    await checkFiles(content);
    
    // generate new content and upload to to the same file
    let second_content = genID();
    await upload(test_file_name, second_content);
    await sleep(sleep_duration_sec);
    await checkFiles(second_content);

    // purge and check result
    log('purge DO Spaces via API');
    await purge([ test_file_name ]);
    await checkFiles(second_content);
    console.log('');
    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^ (EXPECTED: TRUE) ^^^^^^^^^^^^^^^^^^^^^^^^^^^');
    console.log('');
};

const genID = () => (1e5 + Date.now() % 10000).toString(32).toUpperCase();
const load = async (endpoint, opt) => {
    const response = await fetch(endpoint, opt);
    return response.text();
};
const log = (msg) => {
    const dt = new Date().toISOString().split('.')[0].replace('T', ' ');
    console.log(`- ${dt} ${msg}`);
};
const purge = async (files) => {
    const response = await fetch(purge_endpoint, {
        body: JSON.stringify({ files }),
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        },
    });
    log(`purge status code: ${response.status}`)
    if (!response.ok) {
        console.log({
            status: response.status,
            status_text: response.statusText,
        });
    }
    await response.text();
};
const sleep = (sec) => {
    console.log('');
    log(`sleep ${sec} sec`)
    return new Promise((resolve) => setTimeout(resolve, sec * 1000));
};

main();
