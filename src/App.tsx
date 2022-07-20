import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import FileDownload from 'js-file-download'
import QRCode from 'react-qr-code'
import './App.css'

interface FileProps {
  name: string
  fileBase64: string
}

interface networkInterfaceProps {
  address: string
  cidr: string
  family: string
  internal: boolean
  mac: string
  netmask: string
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [fileToUpload, setFileToUpload] = useState<FileProps | null>(null)
  const [apiUrl, setApiUrl] = useState<string>(
    `${window.location.href.split(':3')[0]}:3300/`,
  )
  const [serverIp, setServerIp] = useState<string>('')

  useEffect(() => {
    setApiUrl(`${window.location.href.split(':3')[0]}:3300/`)
  }, [])

  const getServerIp = async () => {
    const response = await axios.get(`${apiUrl}local-ip`)
    Object.entries(response.data).forEach(entry => {
      const [, value] = entry as [key: any, value: networkInterfaceProps[]]
      if(value[0].mac !== '00:00:00:00:00:00'){
        setServerIp(value[0].address)
      }
    })
  }

  const getFileList = useCallback(async () => {
    try {
      const response = await axios.get<string[]>(`${apiUrl}files`)
      setUploadedFiles(response.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(`Ocorreu um erro: ${error.response?.data}`)
      }
    }
  }, [apiUrl])

  const getBase64 = async (file: File) => {
    return new Promise(resolve => {
      let baseURL = "";
      // Make new FileReader
      let reader = new FileReader();

      // Convert the file to base64 text
      reader.readAsDataURL(file);

      // on reader load somthing...
      reader.onload = () => {
        // Make a fileInfo Object
        baseURL = String(reader.result);
        resolve(baseURL);
      };
    });
  };

  const fileBase64 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return alert('Arquivo inválido!')

    const fileToBase64 = String(await getBase64(e.target.files[0])).split(';base64,')[1]

    setFileToUpload({
      name: e.target.files[0].name,
      fileBase64: fileToBase64
    })
  }

  const handleSendFile = async () => {
    if (!fileToUpload) {
      return alert('Selecione um arquivo')
    }

    try {
      await axios.post(`${apiUrl}upload`, {
        name: fileToUpload.name,
        file: fileToUpload.fileBase64,
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(`Ocorreu um erro: ${error.response?.data}`)
      }
    }

    getFileList()
  }

  const handleDownloadFile = async (downloadFilename: string) => {
    try {
      const response = await axios.get(
        `${apiUrl}download?filename=${downloadFilename}`,
        {
          responseType: 'blob',
        },
      )
      FileDownload(response.data, downloadFilename)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(`Ocorreu um erro: ${error.response?.data}`)
      }
    }
  }

  const handleDeleteFile = async (deleteFilename: string) => {
    try {
      await axios.delete(`${apiUrl}delete`, {
        data: {
          name: deleteFilename,
        },
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(`Ocorreu um erro: ${error.response?.data}`)
      }
    }

    getFileList()
  }

  useEffect(() => {
    if (apiUrl) {
      getServerIp()
      getFileList()
    }
  }, [apiUrl, getFileList])

  return (
    <div className="form">
      {window.location.href.includes('localhost') &&
        <div>
          <p>{`http://${serverIp}:3000`}</p>

          <QRCode value={`http://${serverIp}:3000`} />
        </div>
      }

      <input
        type="file"
        multiple={false}
        name="file"
        onChange={fileBase64}
      />

      <button onClick={handleSendFile}>Enviar</button>

      <div>
        <div>
          <h3>Arquivos disponíveis</h3>
        </div>
        <div>
          {uploadedFiles.length > 0 &&
            uploadedFiles.map((file) => (
              <div key={file} className="buttons">
                <div
                  className="downloadButton"
                  onClick={() => handleDownloadFile(file)}
                >
                  {file}
                </div>

                <div
                  className="deleteButton"
                  onClick={() => handleDeleteFile(file)}
                >
                  Deletar
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default App
