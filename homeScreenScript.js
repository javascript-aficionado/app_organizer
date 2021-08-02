const electron = require('electron');
const {app, nativeImage, ipcRenderer, dialog} = electron;
const fr = document.getElementById("the_form");
const fs = require('fs');
const { brotliDecompressSync } = require('zlib');
const cp = require('child_process');
const open = require('open');

//arrays required for rendering
let apps;
let imgs;
let names;
let websites;

document.getElementById('add_btn').onclick = add;

//variables required for drag and drop control
let draggables = [];
let div_containers = [];
let dragging;
let current_content;
let is_dragging;
let target_container;
let order_array = [];
let target_index;

let decoy = document.createElement('div');
decoy.classList.add('decoy');
decoy.style.height = '65px';

//accept info about previously saved groups and apps (and maybe websites, at some point)
ipcRenderer.on('init:groups', (event, temp)=>{
    apps = temp._apps;
    imgs = temp._imgs;
    names = temp._names;
    websites = temp._websites;

    div_containers = [];
    draggables = [];
    if(order_array.length == 0){
        for(let i = 0; i < apps.length; i++){
            order_array.push(i);
        }
    }

    render_list();

    //drag-related procedures
    draggables = document.querySelectorAll('.group');
    const _div_containers = document.querySelectorAll('.container');
    _div_containers.forEach(container=>{
        div_containers.push(container);
    });

    document.addEventListener('mousemove', e=>{  
        e.preventDefault();  
        if(is_dragging){
            dragging.style.top = e.pageY+'px';
        }
    });

    document.addEventListener('mouseup', ()=>{
        if(is_dragging){
            is_dragging = false;
            dragging.classList.remove('dragging');
            target_container.appendChild(dragging);
            target_container.removeChild(decoy);
            dragging = null;

            ipcRenderer.send('order_changed', order_array);
        }
    });

    for(let i = 0; i < draggables.length; i++){
        let draggable = draggables[i];
        draggable.addEventListener('mousedown', e=>{
            if(e.target.getAttribute('type') == 'image') return false;
            if(!is_dragging){
                e.preventDefault();
                dragging = draggable;
                target_index = div_containers.indexOf(draggable.parentElement);

                target_container = draggable.parentElement;
                target_container.removeChild(draggable);
                draggable.classList.add('dragging');
                draggable.style.top = e.pageY + 'px';
                fr.appendChild(draggable);
                is_dragging = true;

                target_container.appendChild(decoy);
            }
        });
    }

    for(let i = 0; i < div_containers.length; i++){
        let container = div_containers[i];
        container.addEventListener('mouseover', e=>{
            if(is_dragging && container != target_container){
                e.preventDefault();
                container.appendChild(decoy);
                current_content = container.querySelector('.group');
                container.removeChild(current_content);
                target_container.appendChild(current_content);
                target_container = container;

                [order_array[i], order_array[target_index]] = [order_array[target_index], order_array[i]];
                target_index = i;
            }
        });
    }
});

function render_list(){
    fr.innerHTML = '';

    //generate divs corresponding to groups.
    for(let i = 0; i < apps.length; i++){
        //external div exists to position draggables
        let external_div = document.createElement('div');
        let div = document.createElement('div');
        let edit_button = document.createElement('input');
        let del_button = document.createElement('input');
        let text_name = document.createElement('h3');
        let run_button = document.createElement('input');
        
        external_div.setAttribute('class', 'container');

        div.setAttribute('class', 'group');
        external_div.appendChild(div);

        text_name.innerHTML = names[i];
        div.appendChild(text_name);

        for(let j = 0; j < apps[i].length; j++){
            let img = document.createElement('img');
            img.setAttribute('src', imgs[i][j]);
            div.appendChild(img);
        }

        edit_button.setAttribute('type', 'image');
        edit_button.setAttribute('src', './gear_icon.png');
        //edit_button.setAttribute('value', 'Edit');
        edit_button.setAttribute('class', 'grp_btn grp_edit');
        edit_button.onclick = ()=>{
            ipcRenderer.send('edit_group', i);
        };
        div.appendChild(edit_button);

        run_button.setAttribute('type', 'image');
        run_button.setAttribute('src', './play_icon.png');
        run_button.setAttribute('class', 'grp_btn grp_run');
        //run_button.setAttribute('value', 'Run')
        run_button.onclick = ()=>{
            apps[i].forEach(app=>{
                cp.exec(`start ${app}`);
            });

            websites[i].forEach(website=>{
                open(website);
            });
        };
        div.appendChild(run_button);

        del_button.setAttribute('type', 'image');
        del_button.setAttribute('src', './del_button.png');
        //del_button.setAttribute('value', 'Delete');
        //del_button.setAttribute('class', 'grp_btn grp_del');
        del_button.setAttribute('class', 'grp_btn grp_del');
        del_button.onclick = ()=>{
            ipcRenderer.send('del:group', i);
        };
        div.appendChild(del_button);
    
        fr.appendChild(external_div);
    }
}

ipcRenderer.on('confirm:del', (event, index)=>{
    order_array.splice(order_array.indexOf(index), 1);
    for(let j = 0; j < order_array.length; j++){
        if(order_array[j] > index) order_array[j]--;
    }
    ipcRenderer.send('order_changed', order_array);
});

function add(){
    order_array.push(order_array.length);
    ipcRenderer.send('add:group', {});
    ipcRenderer.send('order_changed', order_array);
}