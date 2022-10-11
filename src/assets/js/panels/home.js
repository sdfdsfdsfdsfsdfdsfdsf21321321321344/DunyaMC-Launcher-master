/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

import { logger, database, changePanel } from '../utils.js';
const { ipcRenderer } = require('electron');
const fs = require('fs');
const request = require('request');
const axios = require('axios');
const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();

//const pkg = require('../package.json');
//const { Launch, Status } = require('minecraft-java-core');
//const launch = new Launch();

const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)

class Home {
    static id = "home";
    async init(config, news) {
        this.config = config
        this.news = await news
        this.database = await new database().init();
        this.initNews();
        this.initLaunch();
        this.initStatusServer();
        this.initBtn();
    }

    async initNews() {
        let news = document.querySelector('.news-list');
        if (this.news) {
            if (!this.news.length) {
                let blockNews = document.createElement('div');
                blockNews.classList.add('news-block', 'opacity-1');
                blockNews.innerHTML = `
                    <div class="news-header">
                        <div class="header-text">
                            <div class="title">Aucun news n'ai actuellement disponible.</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>Vous pourrez suivre ici toutes les news relative au serveur.</p>
                        </div>
                    </div>`
                news.appendChild(blockNews);
            } else {
                for (let News of this.news) {
                    let date = await this.getdate(News.publish_date)
                    let blockNews = document.createElement('div');
                    blockNews.classList.add('news-block');
                    blockNews.innerHTML = `
                        <div class="news-header">
                            <div class="header-text">
                                <div class="title">${News.title}</div>
                            </div>
                            <div class="date">
                                <div class="day">${date.day}</div>
                                <div class="month">${date.month}</div>
                            </div>
                        </div>
                        <div class="news-content">
                            <div class="bbWrapper">
                                <p>${News.content.replace(/\n/g, '</br>')}</p>
                                <p class="news-author">Auteur,<span> ${News.author}</span></p>
                            </div>
                        </div>`
                    news.appendChild(blockNews);
                }
            }
        } else {
            let blockNews = document.createElement('div');
            blockNews.classList.add('news-block', 'opacity-1');
            blockNews.innerHTML = `
                <div class="news-header">
                    <div class="header-text">
                        <div class="title">Error.</div>
                    </div>
                </div>
                <div class="news-content">
                    <div class="bbWrapper">
                        <p>Impossible de contacter le serveur des news.</br>Merci de vérifier votre configuration.</p>
                    </div>
                </div>`
            // news.appendChild(blockNews);
        }
    }

    async initLaunch() {
        document.querySelector('.play-btn').addEventListener('click', async() => {
            //let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
            let uuid = (await this.database.get('1234', 'accounts-selected')).value;
            let account = (await this.database.get(uuid.selected, 'accounts')).value;
            let ram = (await this.database.get('1234', 'ram')).value;
            let javaPath = (await this.database.get('1234', 'java-path')).value;
            let javaArgs = (await this.database.get('1234', 'java-args')).value;
            let Resolution = (await this.database.get('1234', 'screen')).value;
            let launcherSettings = (await this.database.get('1234', 'launcher')).value;
            let screen;

            let playBtn = document.querySelector('.play-btn');
            let info = document.querySelector(".text-download")
            let progressBar = document.querySelector(".progress-bar")

            if (Resolution.screen.width == '<auto>') {
                screen = false
            } else {
                screen = {
                    width: Resolution.screen.width,
                    height: Resolution.screen.height
                }
            }


            var clientname = "DunyaMC-1.16.5";
            //var pat = `${dataDirectory}\\${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`
            var pat = `${process.env.APPDATA +"\\.DunyaMC" || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")}`
            
            let opts = {
                clientPackage: null,
                authorization: account,
                root: pat,
                version: {
                    number: clientname,
                    type: "release"
                },
                memory: {
                    max: `${ram.ramMax * 1024}M`,
                    min: `${ram.ramMin * 1024}M`
                }
            }
            playBtn.style.display = "none"
            info.style.display = "block"

            var fileUrl = "http://dunyamc.com/texturepack/dunyamctexturepack.zip"; //texture pack url
            var output = pat+"\\resourcepacks\\dunyamctexturepack.zip"; 

            if(!fs.existsSync(pat)){
                fs.mkdirSync(pat); 
                if(!fs.existsSync(pat+"\\resourcepacks")){
                    fs.mkdirSync(pat+"\\resourcepacks");
                }
                if(!fs.existsSync(pat+"\\versions")){
                    fs.mkdirSync(pat+"\\versions");
                }
            }
            request({url: fileUrl, encoding: null}, function(err, resp, body) {
                if(err) throw err;
                fs.writeFile(output, body, function(err) {
                    if(!fs.existsSync(pat+"\\versions\\DunyaMC-1.16.5")) {
                        fs.mkdirSync(pat+"\\versions\\DunyaMC-1.16.5")
                        
                        document.querySelector(".text-download").innerHTML = `Guncelleme Yapiliyor...`
                        request({url: "http://dunyamc.com/launcher/launcherv1/files/files/versions/DunyaMC-1.16.5/DunyaMC-1.16.5.jar", encoding: null}, function(err, resp, body) {
                            if(err) throw err;
                            fs.writeFile(pat+"\\versions\\DunyaMC-1.16.5\\DunyaMC-1.16.5.jar", body, function(err) {
                                request({url: "http://dunyamc.com/launcher/launcherv1/files/files/versions/DunyaMC-1.16.5/DunyaMC-1.16.5.json", encoding: null}, function(err, resp, body) {
                                    if(err) throw err;
                                    fs.writeFile(pat+"\\versions\\DunyaMC-1.16.5\\DunyaMC-1.16.5.json", body, function(err) {
                                        launcher.launch(opts);
                                    })
                                })
            
                            })
                        })
                        
                    }else{
                        launcher.launch(opts);
                
                    } 
                    

                
                });
                
            });
            launcher.on('debug', (e) => console.log(e));
            
            launcher.on('progress', (e) => {
                progressBar.style.display = "block"
                document.querySelector(".text-download").innerHTML = `Yukleniyor ${e.task || 0}/${e.total || 0}`
                console.log(e)
                //progressBar.value = DL;
                //progressBar.max = totDL;
            })

            launcher.on('data', (e) => {
                new logger('Minecraft', '#36b030');
                if(launcherSettings.launcher.close === 'close-launcher') ipcRenderer.send("main-window-hide");
                progressBar.style.display = "none"
                info.innerHTML = `Devam ediyor...`
                console.log(e);
            })

            launcher.on('close', () => {
                if(launcherSettings.launcher.close === 'close-launcher') ipcRenderer.send("main-window-show");
                progressBar.style.display = "none"
                info.style.display = "none"
                playBtn.style.display = "block"
                info.innerHTML = `Kontrol Ediliyor`
                new logger('Launcher', '#7289da');
                console.log('Close');
            })

        })
    }

    
    async initStatusServer() {
        let nameServer = document.querySelector('.server-text .name');
        let serverMs = document.querySelector('.server-text .desc');
        let playersConnected = document.querySelector('.etat-text .text');
        let online = document.querySelector(".etat-text .online");
        var ip = "oyna.dunyamc.com";
        var port = 25565;
        var url = `https://mcapi.xdefcon.com/server/${ip}:${port}/full/json`

        axios.get(url).then((res) => {
            let data = res.data;
                
            if (data.serverStatus == "online") {
                serverMs.innerHTML = `<span class="green">${ip}</span>`;
                online.classList.toggle("off");
                playersConnected.textContent = `${data.players}/${data.maxplayers}`;
            } else{
                nameServer.textContent = 'Sunucu Kapalı Görünüyor';
                serverMs.innerHTML = `<span class="red">${ip}</span>`;
            }
        })
    }

    initBtn() {
        document.querySelector('.settings-btn').addEventListener('click', () => {
            changePanel('settings');
        });

          




        
    }

    async getdate(e) {
        let date = new Date(e)
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()
        let allMonth = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
        return { year: year, month: allMonth[month - 1], day: day }
    }
}





export default Home;