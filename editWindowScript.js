const {ipcRenderer, ipcMain} = require('electron');
const fr = document.getElementById('app_form');
const website_fr = document.getElementById('website_form');
const name_fr = document.getElementById('title_form');
const cp = require('child_process');
const { contextIsolated } = require('process');
const { brotliDecompressSync } = require('zlib');
const open = require('open');

//id and name of group
let grp_id;
let grp_name;

//the arrays of apps and images. A constant copy of these is required for the 'cancel' button
let c_apps;
let c_imgs;
let c_name;
let c_websites;
var apps = [];
var imgs = [];
var websites = [];
let normalized_apps = [];

//give the already existing buttons click events
document.getElementById('cancel_btn').onclick = cncl;
document.getElementById('run_btn').onclick = run;
document.getElementById('done_btn').onclick = done;
document.getElementById('add_app_btn').onclick = add_app;
document.getElementById('add_website_btn').onclick = add_website;

document.getElementById('name_btn').onclick = ()=>{
    name_fr.innerHTML = `<input type="text" id = "name_field" value = "${grp_name}"></input>
    <input type="submit" id = "name_sbt" value = "Change Name"></input>`;

    document.getElementById('name_sbt').onclick = ()=>{
        grp_name = document.getElementById('name_field').value;
        name_fr.innerHTML = '<h1 id = "group_title"></h1><input id = "name_btn", type = "submit", value = "Edit name"></input>';
        document.getElementById('group_title').innerHTML = grp_name;
    };
};

//generate the list of apps
ipcRenderer.on('init:apps', (event, temp)=>{
    grp_id = temp._id;
    grp_name = temp._name;
    apps = temp._apps;
    imgs = temp._imgs;
    websites = temp._websites;

    c_apps = apps;
    c_imgs = imgs;
    c_name = grp_name;
    c_websites = temp._websites;

    render_list();
    render_website_list();
});

ipcRenderer.on('receive:new_app', (event, data)=>{
    let to_del = [];
    temp_apps = data._apps;
    temp_imgs = data._imgs;
    for(let i = 0; i < temp_apps.length; i++){
        if(apps.includes(temp_apps[i])){
            to_del.push(i);
        }
    }

    to_del.reverse();

    to_del.forEach(index=>{
        temp_apps.splice(index, 1);
        temp_imgs.splice(index, 1);
    });

    apps = apps.concat(temp_apps);
    imgs = imgs.concat(temp_imgs);

    render_list();
});

ipcRenderer.on('receive:new_website', (event, website)=>{
    if(!websites.includes(website)){
        websites.push(website);

        render_website_list();
    }
});

//function that creates the list of apps (on the html page). Will be necessary since deletion and addition should trigger a redrawing
function render_list(){
    //Make header display group name
    document.getElementById('group_title').innerHTML = grp_name;

    fr.innerHTML = '';

    normalized_apps = [];
    apps.forEach(app=>{
        normalized_apps.push(normalize(app));
    });

    for(let i = 0; i < apps.length; i++){
        let div = document.createElement('div');
        let img = document.createElement('img');
        let h2 = document.createElement('h2');

        img.setAttribute('src', imgs[i]);
        h2.innerHTML = normalized_apps[i];
        div.appendChild(img);
        div.appendChild(h2);

        let del_btn = document.createElement('input');
        del_btn.setAttribute('type', 'button');
        del_btn.setAttribute('value', 'Delete App'); 
        del_btn.onclick = ()=>{del_app(i);};
        div.appendChild(del_btn);

        fr.appendChild(div);
    }
}

function render_website_list(){
    website_fr.innerHTML = '';

    for(let i = 0; i < websites.length; i++){
        let div = document.createElement('div');
        let h2 = document.createElement('h2');

        h2.innerHTML = websites[i];
        div.appendChild(h2);

        let del_btn = document.createElement('input');
        del_btn.setAttribute('type', 'button');
        del_btn.setAttribute('value', 'Delete Website'); 
        del_btn.onclick = ()=>{del_website(i);};
        div.appendChild(del_btn);

        website_fr.appendChild(div);
    }
}

function del_app(index){
    apps.splice(index, 1);
    imgs.splice(index, 1);
    render_list();
}

function del_website(index){
    websites.splice(index, 1);
    render_website_list();
}

//if the user does not want to make the changes, just send back empty arrays so that nothing happens
function cncl(){
    ipcRenderer.send('close:editWindow', {_id: grp_id, _name: c_name, _apps: c_apps, _imgs: c_imgs, _websites: c_websites});
}

//execute all apps in the group
function run(){
    apps.forEach(app=>{
        cp.exec(`start ${app}`);
    });

    websites.forEach(website=>{
        open(website);
    });
}

//in case the user wants to make changes, make sure to update the list of apps in the group
function done(){
    ipcRenderer.send('close:editWindow', {_id: grp_id, _name: grp_name, _apps: apps, _imgs: imgs, _websites: websites});
}

function add_app(){
    ipcRenderer.send('add:app', {});
}

function add_website(){
    ipcRenderer.send('add:website', {});
}

//normalize a string by keeping only the name of the file and not the entire directory
function normalize(str){
    temp = str.split('/');
    temp2 = temp;
    temp.forEach(_str=>{
        temp2 = temp2.concat(_str.split("\\"));
    });

    res = temp2[temp2.length-1].split('.');
    return res[0];
}