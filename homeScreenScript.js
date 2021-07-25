const electron = require('electron');
const {app, nativeImage, ipcRenderer, dialog} = electron;
const fr = document.getElementById("the_form");
const fs = require('fs');
const { brotliDecompressSync } = require('zlib');
const cp = require('child_process');
const open = require('open');

let apps;
let imgs;
let names;
let websites;

document.getElementById('add_btn').onclick = add;

//accept info about previously saved groups and apps (and maybe websites, at some point)
ipcRenderer.on('init:groups', (event, temp)=>{
    apps = temp._apps;
    imgs = temp._imgs;
    names = temp._names;
    websites = temp._websites;
    console.log(websites);

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
        let run_button = document.createElement('input');

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

        run_button.setAttribute('type', 'button');
        run_button.setAttribute('float', 'right');
        run_button.setAttribute('value', 'Run')
        run_button.onclick = ()=>{
            apps[i].forEach(app=>{
                cp.exec(`start ${app}`);
            });

            websites[i].forEach(website=>{
                open(website);
            });
        };
        div.appendChild(run_button);

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