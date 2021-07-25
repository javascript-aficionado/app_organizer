//basic app menu (file, toggle DevTools...)
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add Collection',
                click(){}
            },
            {
                label: 'Clear All Collections',
                click(){}
            },
            {
                label: 'Delete all collections',
                click(){}
            },
            {
                label: 'Quit',
                accelerator: process.platrofm == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

exports.mainMenuTemplate = mainMenuTemplate;