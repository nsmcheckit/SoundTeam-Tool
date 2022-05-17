import {BrowserRouter as Router, Route, Link, Routes} from "react-router-dom";
import { useState } from "react";
import { flatMapDeep, flattenDeep, includes } from "lodash";
import { saveAs } from "file-saver";
import App from './App';
import axios from 'axios'
import waapi from "../src/AK/WwiseAuthoringAPI/js/waapi.js";

// Show a generic message
var showMessage = function (kind, message) {
    var e = document.getElementById(kind);
    if (message.length === 0)
        e.style.display = "none";
    else
        e.style.display = "block";

    e.innerHTML = message;
}

function waapiCall(uri, args, options, onSuccess, onError) {
    (() => {
        const axios = require('axios');
        const ak = require('..\\src\\AK\\WwiseAuthoringAPI\\js\\waapi.js').ak;
        const data = {
            uri: uri,
            options: {},
            args: args
        };
        
        const handleResponse = (status, headers, objectPayload) => {
            if (status != 200) {
                console.log(status,headers,objectPayload)
                //   if (headers["content-type"] == "application/json") {
                //       console.log(`Error: ${objectPayload.uri}: ${JSON.stringify(objectPayload)}`);
                //   } else {
                //       console.log(`Error: ${Buffer.from(objectPayload).toString("utf8")}`);
                //   }
            } else {
                console.log("Hello wappi");
            }
        };

        let xhr = new XMLHttpRequest();
        //第二步  使用open 创建请求 第一个参数是请求方式 第二个是请求的地址  第三个是同步或者异步
        xhr.open('post',"http://localhost:8090/waapi",true)
        //如果是post请求  必须要写请求头
        // xhr.setRequestHeader("content-type", "application/json") //设置请求头
        //第三步  为xhr.onreadystatechange  设置监听事件
        xhr.onreadystatechange = function(){
            console.log(xhr)
        //     if(xhr.readyState == 4) {
        //     if(xhr.status == 200){
        //     alert(xhr.responseTwxt)
        // //readyState  0 请求未初始化  刚刚实例化XMLHttpRequest
        // //readyState  1 客户端与服务器建立链接  调用open方法
        // //readyState  2 请求已经被接收
        // //readyState  3 请求正在处理中
        // //readyState  4 请求成功
        //             }
        //        }
        }
        // 第四步 发送请求数据  调用send 发送请求 如果不需要参数就写一个null
        xhr.send(JSON.stringify(data))   
    })();
}

function Dialogue(){
    document.title = "SoundTeam语音批量导入工具";
    //uri: ak.wwise.core.getInfo
    (() => {
        const axios = require('axios');
        const ak = require('..\\src\\AK\\WwiseAuthoringAPI\\js\\waapi.js').ak;
        const data = {
            uri: ak.wwise.core.getInfo,
            options: {},
            args: {}
        };
        
        const handleResponse = (status, headers, objectPayload) => {
            
            if (status != 200) {
                //    if (headers["content-type"] == "application/json") {
                //        console.log(`Error: ${objectPayload.uri}: ${JSON.stringify(objectPayload)}`);
                //    } else {
                //        console.log(`Error: ${Buffer.from(objectPayload).toString("utf8")}`);
                //    }
            } else {
                //console.log(`Hello ${objectPayload.displayName} ${objectPayload.version.displayName}`);
                showMessage("load_success_message", `Connected to ${objectPayload.displayName} ${objectPayload.version.displayName}.`);
            }
        };

        axios({
            method: "get",
            url: "http://localhost:8090/waapi",
            // params:data,
             // data: data,
             headers: { "content-type": "application/json" },
        }).then((response) => {
            handleResponse(response.status, response.headers, response.data);
        }).catch((err) => {
            if (err.response) {
                handleResponse(err.response.status, err.response.headers, err.response.data);
            } else {
                console.log(`Error: ${err.message}`);
            }
        });
        
    })();
    
    const [dialogueCsv, setDialogueCsv] = useState([]);
    const [audioFilesFolder, setAuidoFilesFolder] = useState("");
    const [audioFiles, setAudioFiles] = useState([]);
    //找到特定列
    const getColumns = (dialogueCsv) =>{
        const columns = (dialogueCsv || "")
        .replace(/,\n/g,'#')
        .split("#")
        .map((item) => item.replace(/"/g,""))
        .map((item) => item.replace(/\n/g,""));

        //console.log(columns);
        // const titlefirst = (dialogueCsv || "").split(/\"/);//通过"分割文件
        // const titlesecond = flattenDeep(titlefirst.map((item) => item.split(",")))
        // .map((item) => item.trim())
        // .filter(function (s) {
        //     return s && s.trim(); 
        // });;//每个单元格分出来

        const title = columns[1].split(",");
        //console.log(title);
        const findId = (name) =>{
            for(let i = 0; i<title.length; i++){
                if (title[i].includes(name)){
                    return i;
                }
                
            }
            return -1;
        }

        //找到特定列数
        const wwiseEventId = findId("WwiseEvent");
        const typeId = findId("Type");
        const technicalNameId = findId("TechnicalName");
        const audioFileNameId = findId("Audio File Name");

        const data = columns
        .slice(2,)
        .map((column) => column.split(",").map((item) => item.trim()))
        //console.log("data: " + data);
        const newData = data[0].map((col,i) => data.map(row => row[i]));//行列反转
        //console.log(newData);
        const wwiseEvent = newData[wwiseEventId];//事件名
        let technicalName = newData[technicalNameId];//角色名
        const audioFileName = newData[audioFileNameId];//文件名
        for (let i = 0; i < audioFileName.length; i++){
            if(audioFileName[i].includes(".wav") === false){
                audioFileName[i] += ".wav";
            }
        }
        if( typeof(technicalName) === 'undefined' ){
            //console.log(typeof(technicalName));
                technicalName = wwiseEvent.map((item)=>item.split("_").slice(1,2));
        }
        //console.log(audioFileName);
        const audioFileNameNoWav = audioFileName.map((item) => (item || "").split(".")[0]);//文件名不加.wav
        const randomName = audioFileNameNoWav.map((item)=>item.split("_").slice(0,-1).join("_"));
        const type = newData[typeId]//类型
            //  console.log("event: "+wwiseEvent);
            //  console.log("角色名: "+technicalName);
            //  console.log("表格文件名: "+audioFileName);
            //  console.log("类型: "+type);

        const audioFilesTexture = [];//音频文件名
        
        for(const file of audioFiles) {
            audioFilesTexture.push(file.name);
        }
        

        const wrongAudioFilesTextture = [];
        function testAudioFilesTextture(){
            for(let i = 0; i < wwiseEvent.length; i++){
                    if(audioFilesTexture.includes(audioFileName[i])){
                        continue;
                    }
                    else 
                        wrongAudioFilesTextture.push(audioFileName[i]);
                }
                
            
            return wrongAudioFilesTextture;
        }
        testAudioFilesTextture();
        //console.log(wrongAudioFilesTextture);

        if ( wrongAudioFilesTextture.length !== 0){
            var a = window.confirm( wrongAudioFilesTextture+" 与本地命名不一致！是否仍要导出？");
            if(a === true){
                //eslint-disable-line
                alert("导出成功");
            }
            else {
                alert("导出失败");
                return;
            }
        }



        // console.log("文件名: "+ audioFilesTexture);
        // console.log("path: "+ audioFilesFolder);
        const dia = [];//txt文件数组
        for(let i = 0; i < wwiseEvent.length; i++){
            dia.push(
                {
                    AudioFile:  audioFilesFolder + "\\" + audioFileName[i],
                    ObjectPath: wwiseEvent === randomName ? 
                    "\\Actor-Mixer Hierarchy\\Default Work Unit" + "\\<Actor-Mixer>" + type[i] 
                                + "\\<Switch Container>" + technicalName[i]
                                + "\\<Random Container>" + wwiseEvent[i]
                                + "\\" + audioFileNameNoWav[i]
                    :
                    "\\Actor-Mixer Hierarchy\\Default Work Unit" + "\\<Actor-Mixer>" + type[i] 
                                + "\\<Switch Container>" + technicalName[i]
                                + "\\<Random Container>" + randomName[i]
                                + "\\" + audioFileNameNoWav[i],
                    ObjectType: "Sound Voice"
                }
            )
        }
        //console.log(dia);

        const diaTxt =
            "Audio File\tObject Path\tObject Type\n" +
            flatMapDeep (
                dia.map((item) => {
                    const line = `${item.AudioFile}\t${item.ObjectPath}\t${item.ObjectType}\t`;
                    return [line];
                    }) 
            ).join("\n");
        
        const diaJson = {

            importOperation: "createNew",
            default: {
                importLanguage: "Chinese(CN)"
            },
            imports: []
        }

        for (let i = 0; i < wwiseEvent.length; i++){
            diaJson.imports.push({
                objectPath: wwiseEvent === randomName ? 
                "\\Actor-Mixer Hierarchy\\Default Work Unit" + "\\<Actor-Mixer>" + type[i] 
                            + "\\<Switch Container>" + technicalName[i]
                            + "\\<Random Container>" + wwiseEvent[i]
                            + "\\<Sound Voice>" + audioFileNameNoWav[i]
                :
                "\\Actor-Mixer Hierarchy\\Default Work Unit" + "\\<Actor-Mixer>" + type[i] 
                            + "\\<Switch Container>" + technicalName[i]
                            + "\\<Random Container>" + randomName[i]
                            + "\\<Sound Voice>" + audioFileNameNoWav[i],
                audioFile: audioFilesFolder + "\\" + audioFileName[i],
            })
        }
        //console.log(diaJson);
        let blob = new Blob(["\ufeff"+diaTxt], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `export.txt`);
    }
   
   const getJson = (dialogueCsv) =>{
    const columns = (dialogueCsv || "")
    .replace(/,\n/g,'#')
    .split("#")
    .map((item) => item.replace(/"/g,""))
    .map((item) => item.replace(/\n/g,""));

    //console.log(columns);
    // const titlefirst = (dialogueCsv || "").split(/\"/);//通过"分割文件
    // const titlesecond = flattenDeep(titlefirst.map((item) => item.split(",")))
    // .map((item) => item.trim())
    // .filter(function (s) {
    //     return s && s.trim(); 
    // });;//每个单元格分出来

    const title = columns[1].split(",");
    //console.log(title);
    const findId = (name) =>{
        for(let i = 0; i<title.length; i++){
            if (title[i].includes(name)){
                return i;
            }
            
        }
        return -1;
    }

    //找到特定列数
    const wwiseEventId = findId("WwiseEvent");
    const typeId = findId("Type");
    const technicalNameId = findId("TechnicalName");
    const audioFileNameId = findId("Audio File Name");

    const data = columns
    .slice(2,)
    .map((column) => column.split(",").map((item) => item.trim()))
    //console.log("data: " + data);
    const newData = data[0].map((col,i) => data.map(row => row[i]));//行列反转
    //console.log(newData);
    const wwiseEvent = newData[wwiseEventId];//事件名
    let technicalName = newData[technicalNameId];//角色名
    const audioFileName = newData[audioFileNameId];//文件名
    for (let i = 0; i < audioFileName.length; i++){
        if(audioFileName[i].includes(".wav") === false){
            audioFileName[i] += ".wav";
        }
    }
    if( typeof(technicalName) === 'undefined' ){
        //console.log(typeof(technicalName));
            technicalName = wwiseEvent.map((item)=>item.split("_").slice(1,2));
    }
    //console.log(audioFileName);
    const audioFileNameNoWav = audioFileName.map((item) => (item || "").split(".")[0]);//文件名不加.wav
    const randomName = audioFileNameNoWav.map((item)=>item.split("_").slice(0,-1).join("_"));
    const type = newData[typeId]//类型
        //  console.log("event: "+wwiseEvent);
        //  console.log("角色名: "+technicalName);
        //  console.log("表格文件名: "+audioFileName);
        //  console.log("类型: "+type);

    const audioFilesTexture = [];//音频文件名
    
    for(const file of audioFiles) {
        audioFilesTexture.push(file.name);
    }
    

    const wrongAudioFilesTextture = [];
    function testAudioFilesTextture(){
        for(let i = 0; i < wwiseEvent.length; i++){
                if(audioFilesTexture.includes(audioFileName[i])){
                    continue;
                }
                else 
                    wrongAudioFilesTextture.push(audioFileName[i]);
            }
            
        
        return wrongAudioFilesTextture;
    }
    testAudioFilesTextture();
    //console.log(wrongAudioFilesTextture);

    if ( wrongAudioFilesTextture.length !== 0){
        var a = window.confirm( wrongAudioFilesTextture+" 与本地命名不一致！是否仍要导出？");
        if(a === true){
            //eslint-disable-line
            //alert("导出成功");
        }
        else {
            alert("导出失败");
            return;
        }
    }



    // console.log("文件名: "+ audioFilesTexture);
    // console.log("path: "+ audioFilesFolder);
    const dia = [];//txt文件数组
    for(let i = 0; i < wwiseEvent.length; i++){
        dia.push(
            {
                AudioFile:  audioFilesFolder + "\\" + audioFileName[i],
                ObjectPath: wwiseEvent === randomName ? 
                "\\Actor-Mixer Hierarchy\\Default Work Unit" + "\\<Actor-Mixer>" + type[i] 
                            + "\\<Switch Container>" + technicalName[i]
                            + "\\<Random Container>" + wwiseEvent[i]
                            + "\\" + audioFileNameNoWav[i]
                :
                "\\Actor-Mixer Hierarchy\\Default Work Unit" + "\\<Actor-Mixer>" + type[i] 
                            + "\\<Switch Container>" + technicalName[i]
                            + "\\<Random Container>" + randomName[i]
                            + "\\" + audioFileNameNoWav[i],
                ObjectType: "Sound Voice"
            }
        )
    }
    //console.log(dia);
    
    const diaJson = {

        importOperation: "createNew",
        default: {
            importLanguage: "Chinese(CN)"
        },
        imports: []
    }

    for (let i = 0; i < wwiseEvent.length; i++){
        diaJson.imports.push({
            objectPath: wwiseEvent === randomName ? 
            "\\Actor-Mixer Hierarchy\\Default Work Unit" + "\\<Actor-Mixer>" + type[i] 
                        + "\\<Switch Container>" + technicalName[i]
                        + "\\<Random Container>" + wwiseEvent[i]
                        + "\\<Sound Voice>" + audioFileNameNoWav[i]
            :
            "\\Actor-Mixer Hierarchy\\Default Work Unit" + "\\<Actor-Mixer>" + type[i] 
                        + "\\<Switch Container>" + technicalName[i]
                        + "\\<Random Container>" + randomName[i]
                        + "\\<Sound Voice>" + audioFileNameNoWav[i],
            audioFile: audioFilesFolder + "\\" + audioFileName[i],
        })
    }
    waapiCall(
        'ak.wwise.core.audio.import',
        diaJson,
        null,
        null,
        null
    );

    alert("已导入到Wwise")
    
    }
   

    function handleOutputDiaCsv() {
        if (dialogueCsv.length === 0) {
          alert("No files selected");
          return;
        }

        const file = dialogueCsv[0];
            let reader = new FileReader();
            reader.onload = function (e) {
            const data = e.target.result;
            getColumns(data);
        };
        reader.readAsText(file);
      }

      function sendToWwise() {
        if (dialogueCsv.length === 0) {
          alert("No files selected");
          return;
        }

        const file = dialogueCsv[0];
            let reader = new FileReader();
            reader.onload = function (e) {
            const data = e.target.result;
            getJson(data);
        };
        reader.readAsText(file);
      }

    return (       
    <div> 
        <h2 class="connect">
        <span class="connect" id="load_success_message">Connecting...</span>
        <span id="load_success_project"></span>
        </h2>
        {/*<a href ="nomal">Nomal Mode</a> */}
        <h3>SoundTeam语音批量导入工具 </h3>
        <p id="background">
    <br/>  
        CSV表格:&nbsp;&nbsp;
        <input id="fileInput" type="file" multiple onChange={(e) => setDialogueCsv(e.target.files)}/>
    <br/>
    <br/>   
        语音文件:&nbsp;&nbsp;
        <input id="fileInput" type="file" multiple onChange={(e) => setAudioFiles(e.target.files)}/>
    <br/>
    <br/>
        <input placeholder="语音文件夹路径" type="text" onChange={(e) => setAuidoFilesFolder(e.target.value)}/>
    <br/>
    <br/> 
        <button type="button" onClick={handleOutputDiaCsv}>Output txt</button>
    <br/>
    <br/> 
        <button type="button" class="button2" onClick={sendToWwise}>sendToWwise</button>
    <br/>
    <br/>   
        </p>
    </div>

    );
}

export default Dialogue;