import { useState } from 'react'
import './App.css'
import { Typography } from 'antd';
import { Select } from 'antd';
import readXlsxFile from 'read-excel-file';
import Plot from 'react-plotly.js';
import { Table, Button, Input, Space } from "antd";
//only load when needed

function App() {

const E1_min = 5;        
const E1_step = 5;       
const E2_min = 5;         
const E2_step = 5;       
const E2_count = 1000;
const Tablecolumns = [
  {
    title: 'SetUp',
    dataIndex: 'key',
    key: 'key',
    fixed: 'left',
  },
  { title: 'GRIF110mm', dataIndex: 'g110', key: 'g110' },
  { title: 'GRIF145mm', dataIndex: 'g145', key: 'g145' },
];

const Tabledata = [
  {
    key: 'Chamber',
    g110: "upstream downstream sceptar",
    g145: "empty chamber",
   
  },
  {
    key: 'Delrins',
    g110: "No delrin",
    g145: "No delrin",
   
  },
  {
     key: 'Number of Clovers',
    g110: 16 ,
    g145:16,
  },
  {
     key: 'Clovers distance',
    g110: "All clovers at 11 cm" ,
    g145:"All clovers at 14.5 cm",
  },
  {
     key: 'Suppressors',
    g110: "No suppressors ",
    g145: "No suppressors ",
  },
   {
     key: 'Spectrum',
    g110: " No addback  ",
    g145: " No addback  ",
  },
  
];



  const [count, setCount] = useState(0);
  const [result, setResult] = useState('');
  const [resulterr, setResulterr] = useState('');
  const [POS, setPOS] = useState(null);
  const [paramtype, setparamtype] = useState(null);
  const [GammaE, setGammaE] = useState({InputGammaE1: "",
    InputGammaE2: "",});
  const [Gamma2E, setGamma2E] = useState(null);
  const [plotData110, setPlotData110] = useState(null);
  const [plotData145, setPlotData145] = useState(null);
  const [resultJK, setResultJK] = useState('');
  const [resultJKsig1, setResultJKsig1] = useState('');
  const [resultJKsig2, setResultJKsig2] = useState('');
  const [E1Close, setE1Close] = useState('');
  const [E2Close, setE2Close] = useState('');
  
  let filename1 = '';
  let filename2 = '';
  let fitVal = 0;
  let E1 = 0;
  let E2 = 0;
  
  //set variables for the fit functions
  let A_val = 0;
  let E_0 = 0;
  let B_val = 0;
  let C_val = 0;
  let lambda_s = 0;
  let lambda_t = 0;
  let k_val = 0;
  let A_err = 0;
  let E_0err = 0;
  let B_err = 0;
  let C_err = 0;
  let lambda_s_err = 0;
  let lambda_t_err = 0;
  let k_err = 0;
  
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
  
  const g_function = (Energy)=>{
  	let val = 0;
  	if(POS==="110mm"){
  		if(paramtype==="β"){
  		val =  (0.058/(1 + Math.exp(-0.093*(Energy - 30))) + 0.0199*Math.atan(Math.pow(0.035*(Energy - 30), 0.67)) + 0.89);
  		}
  		else{
  		val =  (0.0953/(1 + Math.exp(-0.131*(Energy - 42.23))) + 0.0296*Math.atan(Math.abs(Math.pow(0.0069*(Energy - 42.23), 0.83))) + 0.787);
  		}
  		return val;
  		}
  	
  	
  
  }
  //this is a old version loading data points and error from dat(txt) file
  //a newer method following use 2d array from js file with 10 files each
  
  const CalConfiLevel = async (E1, E2) => {
  try {
    if (POS !== '110mm') {
      setResultJK(0);
      setResultJKsig1(0);
      setResultJKsig2(0);
      setE1Close(0);
      setE2Close(0);
      return;
    }


    const baseName = paramtype === 'β' ? 'ciGridBeta' : 'ciGridGamma';
    const totalE1 = 1000;      // total E1 points in full grid
    const totalE2 = 1000;       // total E2 points in full grid
    const parts = 10;           // number of part files

    const E1_min = 5;           // minimum E1 value
    const E1_step = 5;          // step in E1
    const E2_min = 5;           // minimum E2 value
    const E2_step = 5;          // step in E2

    // Compute full-grid indices

    const E1_index = Math.round((E1 - E1_min) / E1_step);
    const E2_index = Math.round((E2 - E2_min) / E2_step);


    // Determine which part file to load

    const rowsPerPart = Math.ceil(totalE1 / parts);
    const partIndex = Math.min(parts, Math.floor(E1_index / rowsPerPart) + 1);


    const module = await import(
      /* @vite-ignore */ `./${baseName}_part${partIndex}.js`
    );


    const data = module[`${baseName}_part${partIndex}`] || Object.values(module)[0];

    if (!data) throw new Error(`No data found in part ${partIndex}`);

   
    const E1_index_in_part = E1_index - (partIndex - 1) * rowsPerPart;
    const position = E1_index_in_part * totalE2 + E2_index;

    if (position < 0 || position >= data.length)
      throw new Error(`Invalid index ${position} for part ${partIndex}`);

    const [Energy1, Energy2, b2val, sigma1, sigma2] = data[position];


    setResultJK(b2val);
    setResultJKsig1(sigma1);
    setResultJKsig2(sigma2);
    setE1Close(Energy1);
    setE2Close(Energy2);

    console.log(
      `Loaded part ${partIndex}, position ${position}:`,
      { Energy1, Energy2, b2val, sigma1, sigma2 }
    );

  } catch (err) {
    console.error('Error loading part or accessing index:', err);
    setResultJK(0);
    setResultJKsig1(0);
    setResultJKsig2(0);
    setE1Close(0);
    setE2Close(0);
  }
};




  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  //loading ex
  const loadExcelAndPlot = async () => {
    try {
      if(POS==='110mm'){
      	if(paramtype==='β'){
      filename1 =import.meta.env.BASE_URL +'/GRIF110ATT_beta.xlsx';}
      	else if(paramtype==='γ'){filename1 =import.meta.env.BASE_URL +'/GRIF110ATT_gamma.xlsx';}
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
  	CalConfiLevel(E1,E2);
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
  	setResulterr(CalErorr(E1,E2));
  	
  }
  
  
  
  
  const CalErorr  = (E1,E2) => {
  	if(POS==="110mm"){
  		if(paramtype==="γ"){
  		A_val = 0.0953;
  		E_0 = 42.23;
  		B_val = 0.0296;
  		C_val = 0.787;
  		lambda_s = 0.131;
  		lambda_t = 0.83;
  		k_val = 0.0069;  
  		A_err = 0.0012;
  		E_0err = 0.18;
  		B_err = 0.0007;
  		C_err = 0.008;
  		lambda_s_err = 0.002;
  		lambda_t_err = 0.03;
  		k_err = 0.0003;
  		
  		
  		
  		}
  		else if(paramtype==="β"){
  		A_val = 0.058;
  		E_0 = 30.0;
  		B_val = 0.0199;
  		C_val = 0.89;
  		lambda_s = 0.093;
  		lambda_t = 0.67;
  		k_val = 0.035;  
  		A_err = 0.003;
  		E_0err = 0.7;
  		B_err = 0.0007;
  		C_err = 0.002;
  		lambda_s_err = 0.004;
  		lambda_t_err = 0.04;
  		k_err = 0.002;
  		
  		
  		}
  	}
  	
  	let df_dA_val1 = 0;
  	let df_dA_val2 = 0;
  	let df_dlamda_s1 = 0;
  	let df_dlamda_s2 = 0;
  	let df_dE_0_1 = 0;
  	let df_dE_0_2 = 0;
  	let df_dB1 = 0;
  	let df_dB2 = 0;
  	let df_dk_val1 = 0;
  	let df_dk_val2 = 0;
  	let df_dlambda_t1 = 0;
  	let df_dlambda_t2 = 0;
  	let df_dC_val1 = 0;
  	let df_dC_val2 = 0;
  	let errG1 = 0;
  	let errG2 = 0;
  	
  	df_dA_val1 = 1/(1+Math.exp(-lambda_s*(E1-E_0)))*g_function(E2) ;
  	df_dA_val2 = 1/(1+Math.exp(-lambda_s*(E2-E_0)))*g_function(E1) ;
  	
  	
  	
  	df_dlamda_s1 = -1/(Math.pow(1+Math.exp(-lambda_s*(E1-E_0)),2))*(E_0-E1)*Math.exp(-lambda_s*(E1-E_0)*A_val);
  	df_dlamda_s2 = -1/(Math.pow(1+Math.exp(-lambda_s*(E2-E_0)),2))*(E_0-E2)*Math.exp(-lambda_s*(E2-E_0)*A_val);
  	
  	
  	
  	df_dE_0_1 = -(Math.pow(1+Math.exp(-lambda_s*(E1-E_0)),-2))*lambda_s*Math.exp(-lambda_s*(E1-E_0))*A_val+ k_val*lambda_t*Math.pow(k_val*Math.atan(E1-E_0),lambda_t-1)*B_val/(Math.pow(E1-E_0,2)+1);
  	df_dE_0_2 = -(Math.pow(1+Math.exp(-lambda_s*(E2-E_0)),-2))*lambda_s*Math.exp(-lambda_s*(E2-E_0))*A_val+ k_val*lambda_t*Math.pow(k_val*Math.atan(E2-E_0),lambda_t-1)*B_val/(Math.pow(E2-E_0,2)+1);
  	
  	
  	
  	df_dB1 = Math.atan(Math.pow(k_val*(E1-E_0),lambda_t));
  	df_dB2 = Math.atan(Math.pow(k_val*(E2-E_0),lambda_t));
  	
  	
  	
  	df_dk_val1 = B_val*lambda_t*Math.pow((k_val*Math.atan(E1-E_0)),lambda_t)/k_val 
  	df_dk_val2 = B_val*lambda_t*Math.pow((k_val*Math.atan(E2-E_0)),lambda_t)/k_val;
  	
  	
  	
  	df_dlambda_t1 = Math.pow(k_val*Math.atan(E1-E_0),lambda_t)*Math.log(k_val*Math.atan(E1-E_0))*B_val;
  	df_dlambda_t2 = Math.pow(k_val*Math.atan(E2-E_0),lambda_t)*Math.log(k_val*Math.atan(E2-E_0))*B_val;
  	
  	df_dC_val1 =g_function(E2);
  	df_dC_val2 =g_function(E1);
  	
  	errG1 = Math.sqrt(Math.pow(df_dA_val1*A_err,2) + Math.pow(df_dlamda_s1*lambda_s_err,2) + Math.pow(df_dE_0_1*E_0err,2) +Math.pow(df_dB1*B_err,2) +Math.pow(df_dk_val1*k_err,2) + Math.pow(df_dlambda_t1*lambda_t_err,2) );
  	
  	errG2 = Math.sqrt(Math.pow(df_dA_val2*A_err,2) + Math.pow(df_dlamda_s2*lambda_s_err,2) + Math.pow(df_dE_0_2*E_0err,2) +Math.pow(df_dB2*B_err,2) +Math.pow(df_dk_val2*k_err,2) + Math.pow(df_dlambda_t2*lambda_t_err,2) );
  	
  	console.log("df_dA_val1:", df_dA_val1);
  	console.log("df_dlamda_s1:", df_dlamda_s1);
  	console.log("lambda_s_err:", lambda_s_err);
  	console.log("df_dE_0_1:", df_dE_0_1);
  	console.log("df_dB1:", df_dB1);
  	console.log("df_dk_val1:", df_dk_val1);
  	console.log("df_dlambda_t1:", df_dlambda_t1);
  	console.log("return param:", g_function(E1)*g_function(E2));
  	
  	return Math.sqrt(Math.pow(errG1*g_function(E2),2)+ Math.pow(errG2*g_function(E1),2));
  	
  
  
  }











  return (
    <>
      <div>
      <div>
      <h1>Finite Detector Size Attenuation Factor Calculator
      </h1>
      <h2>This calculator is designed for angular correlation attenuation factor calculation with GRIFFIN 
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
            addonBefore={<span className="addon-label">Energy1</span>}
            placeholder="Enter Energy of First Gamma ray"
            allowClear
            value={GammaE.InputGammaE1}
            onChange={handleChangeEnergy}
            style={{ width: 300 }}
          />

          <Input
            name="InputGammaE2"
            addonBefore={<span className="addon-label">Energy2</span>}
            placeholder="Enter Energy of Second Gamma ray"
            allowClear
            value={GammaE.InputGammaE2}
            onChange={handleChangeEnergy}
            style={{ width: 300 }}
          />
      
      </div>
      <Space direction="vertical" size="large">
      <div />
	
      <div>
       <Button type="primary" onClick={CalBestFit}>
            Calculate
          </Button>
       <Button onClick={loadExcelAndPlot}>Load and Plot</Button>
      <p>Using fit data and standard error propagation the value is estimated as:	{result} +- {resulterr}</p>
      <p>Using root data and confidence level error the value is estimated as:	{resultJK} with σ₁ = {resultJKsig1} and σ₂ = {resultJKsig2}</p>
      <p>The closest energy to the map is at {E1Close}  and   {E2Close}</p>
      </div>
      </Space>
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
         press calculate button to calculate the estimated parameter based on selection made
      </p>
      <p className="read-the-docs">
         press load and plot button to plot the evolution of parameter selected over energy.
      </p>
      <p className="read-the-docs">
         The fitted data result uses fit parameter with precision to uncertainty level with a error propagation without considering covariance.
      </p>
      <p className="read-the-docs">
         The root data evaluates directly based on root fit function with interval of 5keV up to 5MeV. Errors are estimated using root confidence interval where σ₁ is given at 68.3% confidence interval and σ₂ given at 95.5% confidence interval.
      </p>
      
      <Table
      columns={Tablecolumns}
      dataSource={Tabledata}
      bordered
      pagination={false}
      size="middle"
    />
      
      
    </div>
    </>
  )
}

export default App
