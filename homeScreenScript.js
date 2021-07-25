const electron = require('electron');
const {app, nativeImage, ipcRenderer, dialog} = electron;
const fr = document.getElementById("the_form");
const fs = require('fs');
const { brotliDecompressSync } = require('zlib');
const io = require('./input-output.js');

let apps;
let imgs;
let names;

document.getElementById('add_btn').onclick = add;

//accept info about previously saved groups and apps (and maybe websites, at some point)
ipcRenderer.on('init:groups', (event, temp)=>{
    apps = temp._apps;
    imgs = temp._imgs;
    names = temp._names;

    render_list();
});

function render_list(){
    fr.innerHTML = '';

    //generate divs corresponding to groups.
    for(let i = 0; i < apps.length; i++){
        let div = document.createElement('div');
        let edit_button = document.createElement('input');
        let del_button = document.createElement('input');
        let text_name = document.createElement('h3');

        text_name.innerHTML = names[i];
        div.appendChild(text_name);

        for(let j = 0; j < apps[i].length; j++){
            let img = document.createElement('img');
            img.setAttribute('src', imgs[i][j]);
            div.appendChild(img);
        }

        edit_button.setAttribute('type', 'button');
        edit_button.setAttribute('float', 'right');
        edit_button.setAttribute('value', 'Edit')
        edit_button.onclick = ()=>{
            ipcRenderer.send('edit_group', i);
        };
        div.appendChild(edit_button);

        del_button.setAttribute('type', 'button');
        del_button.setAttribute('float', 'right');
        del_button.setAttribute('value', 'Delete');
        del_button.onclick = ()=>{
            ipcRenderer.send('del:group', i);
        };
        div.appendChild(del_button);
    
        fr.appendChild(div);
    }
}

function add(){
    ipcRenderer.send('add:group', {});
}