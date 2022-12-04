import { InferGetStaticPropsType } from 'next'
import 'react-tabulator/lib/styles.css'; // required styles

// --- Comment out the Theme you want to try:
import "react-tabulator/css/tabulator.min.css"; // default
// import "react-tabulator/css/tabulator_modern.min.css"; // default
// import "react-tabulator/css/bootstrap/tabulator_bootstrap.min.css"; // bootstrap
//import "react-tabulator/css/bulma/tabulator_bulma.min.css"; // bulma
// import "react-tabulator/css/semantic-ui/tabulator_semantic-ui.min.css"; // semantic
// import "react-tabulator/css/materialize/tabulator_materialize.min.css"; // meterialize

import { ReactTabulator } from 'react-tabulator';

export function getStaticProps() {
  const {lastPath} = require('../isbn/lastPath.js');
 
  const data = require('../'+lastPath+'/isbn.json');
  const head = data.data[Object.keys(data.data)[0]].head.slice(0,10);
  const columns = head.map((col, i)=>{
    if(i === 0) {
     return {
        title: col,
        field: col,
        visible: false
      
      }
    }
    if(col === 'ISBN Number') {
      return {
        title: col,
        field: col,        
        minWidth: 120,
        responsive: 1,
      }
    }
    if(col === 'Title')
    return {
      title: col,
      field: col,
      headerFilter: "input",
      minWidth: 320,
      responsive:0,
      dir:"asc"
    }
    else {
      return {
        title: col,
        field: col,
      }
    }
  });
  let rows = [];
  Object.keys(data.data).reverse().forEach((appId)=> {
    rows = rows.concat(data.data[appId].table);
  })
  rows = rows.map((row)=> {
    const rowobj = {};
    for(let i=0; i<head.length; i++) {
      if(head[i] === "ISBN Number") {
          rowobj['id'] = head[i];
       }
      rowobj[head[i]] = row[i];
    } 
    return rowobj
  })
  return {
    props: {
      folder: lastPath,
      columns,
      rows
    },
  }
}

export default function SSGPage({
  folder,
  columns,
  rows,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return <div>{folder} 
  <div>
 
  <ReactTabulator columns={columns} data={rows} options={
    {
      responsiveLayout: 'collapse',
    }
  } />
  </div>
  </div>
  
}
