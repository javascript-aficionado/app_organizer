const electron = require('electron');
const url = require('url');
const path = require('path');
const {mainMenuTemplate} = require(path.join(__dirname, 'menu.js'));
const io = require(path.join(__dirname, 'input-output.js'));
const fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain, ipcRenderer, dialog, nativeImage} = electron;

//class containing information about a specific app
class entry{
    constructor(name, img){
        this.name = name;
        this.img = img;
    }
}

//class containing information about an entire group
class group{
    constructor(){
        this.entries = [];
        this.name = "group";
    }
}

//save files
const app_file = path.resolve((process.env.NODE_ENV === 'development') ? __dirname : __dirname.substring(0, __dirname.length - 9), 'save_apps.txt');
const website_file = path.resolve((process.env.NODE_ENV === 'development') ? __dirname : __dirname.substring(0, __dirname.length - 9), 'save_websites.txt');

//const app_file = path.resolve(__dirname, 'save_apps.txt');
//const website_file = path.resolve(__dirname, 'save_websites.txt');


//arrays to store app and website names. They will be passed on to the home screen
let apps;
let websites;
let imgs = [];
let names;
let order = [];

//windows of the applications (doesn't take a genius to figure this out)
let homeScreen;
let editWindow;
let addWebsiteWindow;

//initialize home screen
app.on('ready', function(){
    console.log(process.env.NODE_ENV);
    homeScreen = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    homeScreen.loadURL(url.format({
        pathname: path.join(__dirname, "homeScreen.html"),
        protocol: 'file:',
        slashes: true
    }));

    homeScreen.on('close', ()=>{
        let new_apps = [];
        let new_websites = [];
        let new_imgs = [];
        let new_names = [];

        order.forEach(index=>{
            new_apps.push(apps[index]);   
            new_websites.push(websites[index]);
            new_imgs.push(imgs[index]);
            new_names.push(names[index]); 
        });

        console.log(names);

        apps = new_apps;
        websites =  new_websites;
        imgs = new_imgs;
        names = new_names;

        console.log(names);

        //sometimes my genius, it's just frightening
        for(let i = 0; i < order.length; i++){
            order[i] = i;
        }

        io.save_groups(app_file, names, apps);
        io.save_websites(website_file, websites);
        app.quit();
    });

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

    //get directories to open from save file and pass them to the home screen
    let _temp = (fs.existsSync(app_file) ? io.load_groups(app_file) : {_names: [], _apps: []});
    names = _temp._names;
    apps = _temp._apps;

    websites = (fs.existsSync(app_file) ? io.load_websites(website_file) : []);

    //find the images of the apps
    imgs = [];
    for(let i = 0; i < apps.length; i++){
        imgs.push([]);
        for(let j = 0; j < apps[i].length; j++){
            app.getFileIcon(apps[i][j]).then(
                (fileIcon)=>{
                    imgs[i][j] = fileIcon.toDataURL();
                }
            );
        }
    }

    //set the default order to be the identity permutation
    for(let i = 0; i < apps.length; i++){
        order.push(i);
    }

    homeScreen.webContents.on('did-finish-load', ()=>{
        homeScreen.webContents.send('init:groups', {_names: names, _apps: apps, _imgs: imgs, _websites: websites});
    });
});

//Delete selected group
ipcMain.on('del:group', (event, index)=>{
    dialog.showMessageBox(homeScreen, {
        message: 'Are you sure you want to want to delete this group?',
        type: 'warning',
        buttons: ['Ok', 'cancel'],
        defaultId: 0,
        title: 'Deletion confirmation'
    }).then(res=>{
        //we only want to delete a group if the user clicked ok
        if(res.response == 0){
            apps.splice(index, 1);
            imgs.splice(index, 1);
            names.splice(index, 1); 
            websites.splice(index, 1);
            homeScreen.webContents.send('init:groups', {_names: names, _apps: apps, _imgs: imgs, _websites: websites});
        }
    });
});

//add new group. This opens the group editor for a new, blank group
ipcMain.on('add:group', (event, data)=>{
    editWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    editWindow.loadURL(url.format({
        pathname: path.join(__dirname, "editWindow.html"),
        protocol: 'file:',
        slashes: true
    }));

    editWindow.on('close', ()=>{
        editWindow = null;
    });

    editWindow.webContents.on('did-finish-load', ()=>{
        apps.push([]);
        imgs.push([]);
        names.push('New Group');
        websites.push([]);
        editWindow.webContents.send('init:apps', {_id: apps.length - 1, _name: 'New Group', _apps: [], _imgs: [], _websites: []});
    });
});

//recognize the need to edit a group
ipcMain.on('edit_group', (event, index)=>{
    editWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    editWindow.loadURL(url.format({
        pathname: path.join(__dirname, "editWindow.html"),
        protocol: 'file:',
        slashes: true
    }));

    editWindow.on('close', ()=>{
        editWindow = null;
    });

    editWindow.webContents.on('did-finish-load', ()=>{
        editWindow.webContents.send('init:apps', {_id: index, _name: names[index], _apps: apps[index], _imgs: imgs[index], _websites: websites[index]});
    });
});

//update apps and images before exiting
ipcMain.on('close:editWindow', (event, data)=>{
    if(data._apps.length > 0){
        apps[data._id] = data._apps;
        imgs[data._id] = data._imgs;
        names[data._id] = data._name;
        websites[data._id] = data._websites;
    }else{
        //if the group has been emptied, make sure to delete it form the list
        apps.splice(data._id, 1);
        imgs.splice(data._id, 1);
        names.splice(data._id, 1);
        websites.splice(data._id, 1);
    }

    editWindow.close();

    //notify the home screen to also change its content accordingly
    homeScreen.webContents.send('init:groups', {_names: names, _apps: apps, _imgs: imgs, _websites: websites});
});

ipcMain.on('add:app', (event, data)=>{
    //Open file explorer to select new apps
    to_add = dialog.showOpenDialogSync(editWindow, {
        properties: ['openFile', 'multiSelections'],

        filters: [
            {name: 'Executibles', extensions: 'exe'},
            {name: 'All Files', extensions: '*'}
        ]
    });

    //find images of selected new apps
    to_add_imgs = [];
    for(let i = 0; i < to_add.length; i++){
        to_add_imgs.push('');
    }

    for(let i = 0; i < to_add.length - 1; i++){
        app.getFileIcon(to_add[i]).then(
            (fileIcon)=>{
                to_add_imgs[i] = fileIcon.toDataURL();
            }
        );
    }

    if(!(to_add.length == 0)){
        app.getFileIcon(to_add[to_add.length - 1]).then(
            (fileIcon)=>{
                to_add_imgs[to_add.length - 1] = fileIcon.toDataURL();

                editWindow.webContents.send('receive:new_app', {_apps: to_add, _imgs: to_add_imgs});
            }
        );
    }else{
        editWindow.webContents.send('receive:new_app', {_apps: [], _imgs: []});
    }
});

ipcMain.on('add:website', (event, data)=>{
    addWebsiteWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    addWebsiteWindow.loadURL(url.format({
        pathname: path.join(__dirname, "addWebsiteWindow.html"),
        protocol: 'file:',
        slashes: true
    }));

    addWebsiteWindow.on('close', ()=>{
        addWebsiteWindow = null;
    });
});

ipcMain.on('get:website', (event, url)=>{
    if(url != ''){
        editWindow.webContents.send('receive:new_website', url);
        addWebsiteWindow.close();
    }
});

ipcMain.on('order_changed', (event, _order)=>{
    console.log('event received');
    order = _order;
    console.log(order);
});

//small fix for menu on mac
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({});
}

//Push developer tools on app menu when in production
if(process.env.NODE_ENV.trim() === 'development'){
    mainMenuTemplate.push({
        label:'Developer Tools',
        submenu:[
            {
                label: 'Toggle DevTools',
                accelerator: process.platrofm == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                } 
            },
            {
                role: 'reload'
            }
        ]
    });
}