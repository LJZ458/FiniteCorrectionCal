import { useState } from 'react'
import './App.css'
import { Typography } from 'antd';
import { Select } from 'antd';
import readXlsxFile from 'read-excel-file';
import Plot from 'react-plotly.js';
import { Table, Button, Input, Space } from "antd";
function App() {
  const [count, setCount] = useState(0);
  const [result, setResult] = useState('');
  
  const [POS, setPOS] = useState(null);
  const [paramtype, setparamtype] = useState(null);
  const [GammaE, setGammaE] = useState({InputGammaE1: "",
    InputGammaE2: "",});
  const [Gamma2E, setGamma2E] = useState(null);
  const [plotData110, setPlotData110] = useState(null);
  const [plotData145, setPlotData145] = useState(null);

  let filename1 = '';
  let filename2 = '';
  let fitVal = 0;
  let E1 = 0;
  let E2 = 0;
  const handleChange = (value) => {
    setPOS(value);
    console.log('POS:', value);

  };
  const handleChangeParam = (value) => {
    setparamtype(value);
    console.log('paramtype:', value);

  };
  
  const handleChangeEnergy = (e) => {
    
    const { name, value } = e.target;
    setGammaE((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    
  };
  
  
  const loadExcelAndPlot = async () => {
    try {
      if(POS==='110mm'){
      	if(paramtype==='β'){
      filename1 =process.env.PUBLIC_URL+ '/GRIF110ATT_beta.xlsx';}
      	else if(paramtype==='γ'){filename1 =process.env.PUBLIC_URL+ '/GRIF110ATT_gamma.xlsx';}
      }
      else if(POS==='145'){filename1 = 'GRIF145ATT.xlsx';}

      const response = await fetch(filename1);
      console.log('POS:', POS);
      if(!response){//something to alert user file is not loaded properly
      }
      const blob = await response.blob();

      const rows = await readXlsxFile(blob);
      const dataRows = rows.slice(1);
      const x = dataRows.map(row => row[0]);
      const y = dataRows.map(row => row[1]);
      const z = dataRows.map(row => row[2]);
	
      if (POS=='110mm'){
      setPlotData110([
        {
          x,
          y,
          z,
          type: 'scatter3d',
          mode: 'markers',
          marker: {
            size: 2,
            color: z,
            colorscale: 'Viridis',
            colorbar: { title: 'Attenuation' }
          }
        }
      ]);}
      
      else{setPlotData145([
        {
          x,
          y,
          z,
          type: 'scatter3d',
          mode: 'markers',
          marker: {
            size: 2,
            color: z,
            colorscale: 'Viridis',
            colorbar: { title: 'Beta' }
          }
        }
      ]);
      
      }
    } catch (err) {
      console.error('Error loading Excel:', err);
    }
  };
  
  

  const CalBestFit  = () => {
  	E1 = GammaE.InputGammaE1;
  	E2 = GammaE.InputGammaE2;
  	console.log('Gamma1:', GammaE.InputGammaE1);
  	console.log('Gamma2:', GammaE.InputGammaE2);
  	if(POS==="110mm"){
  		if(paramtype==="β"){
  		fitVal=  (0.058/(1 + Math.exp(-0.093*(E1 - 30))) + 0.0199*Math.atan(Math.pow(0.035*(E1 - 30), 0.67)) + 0.89) * (0.058/(1 + Math.exp(-0.093*(E2 - 30))) + 0.0199*Math.atan(Math.pow(0.035*(E2 - 30), 0.67)) + 0.89);
  		}
  		else{
  		fitVal=  (0.0953/(1 + Math.exp(-0.131*(E1 - 42.23))) + 0.0296*Math.atan(Math.abs(Math.pow(0.0069*(E1 - 42.23), 0.83))) + 0.787) * (0.0953/(1 + Math.exp(-0.131*(E2 - 42.23))) + 0.0296*Math.atan(Math.abs(Math.pow(0.0069*(E2 - 42.23), 0.83))) + 0.787);
  		
  		}
  		
  		
  		}
  	setResult(fitVal);
  }

  return (
    <>
      <div>
      <h1>Finite Detector Size Atteneuation Factor Calculator
      </h1>
      <h2>This calculator is designed for angular correlation atteneuation factor calculation with GRIFFIN 
      </h2>
      <h2>For detailed information of corrections please refer to: 
      </h2>
      <h3>
      	<a href="https://www.sciencedirect.com/science/article/abs/pii/S0168900218314116" target="_blank">
      		Nuclear Instruments and Methods in Physics Research Section A: Accelerators, Spectrometers, Detectors and Associated Equipment
Volume 922, 1 April 2019, Pages 47-63
      	</a>
      </h3>
       
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 20 }}>
      <div style={{ width: 160, fontWeight: 500 }}>GRIFFIN Position:</div>
      <Select
      placeholder="Select an option"
      onChange={handleChange}
      value={POS}
      style={{ width: 200 }}
      >
      <Select.Option value="145mm">145mm</Select.Option>
      <Select.Option value="110mm">110mm</Select.Option>
      </Select>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 20 }}>
      <div style={{ width: 160, fontWeight: 500 }}>Parameter:</div>
      <Select
      placeholder="Select an parameter"
      onChange={handleChangeParam}
      value={paramtype}
      style={{ width: 200 }}
      >
      <Select.Option value="β">β</Select.Option>
      <Select.Option value="γ">γ</Select.Option>
      </Select>
      </div>
      <div style={{ display: 'flex', alignItems: 'left', marginTop: 20 }}>
      <Input
            name="InputGammaE1"
            addonBefore="Energy2"
            placeholder="Enter Energy of First Gamma ray"
            allowClear
            value={GammaE.InputGammaE1}
            onChange={handleChangeEnergy}
            style={{ width: 300 }}
          />

          <Input
            name="InputGammaE2"
            addonBefore="Energy2"
            placeholder="Enter Energy of Second Gamma ray"
            allowClear
            value={GammaE.InputGammaE2}
            onChange={handleChangeEnergy}
            style={{ width: 300 }}
          />
      
      </div>
      
      <div>
       <Button type="primary" onClick={CalBestFit}>
            Calculate
          </Button>
       <Button onClick={loadExcelAndPlot}>Load and Plot Excel</Button>
      <p>The estimated value is:	{result}</p>
      </div>
     <div style={{ padding: 20 }}>
      
      {plotData110 && (
        <Plot
          data={plotData110}
          layout={{
            title: 'Attenuation vs Energy_1 and Energy_2',
            scene: {
              xaxis: { title: 'Energy_1' },
              yaxis: { title: 'Energy_2' },
              zaxis: { title: 'Beta' }
            },
            height: 600
          }}
        />
      )}
    </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
