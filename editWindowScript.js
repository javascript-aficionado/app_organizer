const {ipcRenderer, ipcMain} = require('electron');
const fr = document.getElementById('the_form');
const name_fr = document.getElementById('title_form');
const cp = require('child_process');
const { contextIsolated } = require('process');
const { brotliDecompressSync } = require('zlib');

//id and name of group
let grp_id;
let grp_name;

//the arrays of apps and images. A constant copy of these is required for the 'cancel' button
let c_apps;
let c_imgs;
let c_name;
var apps = [];
var imgs = [];
let normalized_apps = [];

//give the already existing buttons click events
document.getElementById('cancel_btn').onclick = cncl;
document.getElementById('run_btn').onclick = run;
document.getElementById('done_btn').onclick = done;
document.getElementById('add_app_btn').onclick = add;

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
    c_apps = apps;
    c_imgs = imgs;
    c_name = grp_name;

    render_list();
});

ipcRenderer.on('receive:new_app', (event, data)=>{
    apps = apps.concat(data._apps);
    imgs = imgs.concat(data._imgs);

    render_list();
});

//function that creates the list of apps (on the html page). Will be necessary since deletion and addition should trigger a redrawing
function render_list(){
    //Make header display group name
    document.getElementById('group_title').innerHTML = grp_name;

    fr.innerHTML = '';

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
        del_btn.onclick = ()=>{del(i);};
        div.appendChild(del_btn);

        fr.appendChild(div);
    }
}

function del(index){
    apps.splice(index, 1);
    imgs.splice(index, 1);
    render_list();
}

//if the user does not want to make the changes, just send back empty arrays so that nothing happens
function cncl(){
    ipcRenderer.send('close:editWindow', {_id: grp_id, _name: c_name, _apps: c_apps, _imgs: c_imgs});
}

//execute all apps in the group
function run(){
    apps.forEach(app=>{
        cp.exec(`start ${app}`);
    });
}

//in case the user wants to make changes, make sure to update the list of apps in the group
function done(){
    ipcRenderer.send('close:editWindow', {_id: grp_id, _name: grp_name, _apps: apps, _imgs: imgs});
}

function add(){
    ipcRenderer.send('add:app', {});
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