const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

// Define your RESTful endpoint
app.post('/submitmeterread', async (req, res) => {
  try {
    const { imgurl, serialno, meterread } = req.body;

    // Create the XML payload for the SOAP request
    const xmlPayload = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cmb="http://oracle.com/CmBotPocInterfaceV2.xsd">
        <soapenv:Header/>
        <soapenv:Body>
          <cmb:CmBotPocInterfaceV2>
            <cmb:request>
              <cmb:requestSequence>1</cmb:requestSequence>
              <cmb:billId></cmb:billId>
              <cmb:complaintDetails></cmb:complaintDetails>
              <cmb:meterReadType>501000</cmb:meterReadType>
              <cmb:meterImageURL>${imgurl}</cmb:meterImageURL>
              <cmb:serialNumber>${serialno}</cmb:serialNumber>
              <cmb:reading>${meterread}</cmb:reading>
            </cmb:request>
          </cmb:CmBotPocInterfaceV2>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

    // Set the headers for the SOAP request
    const headers = {
      'Content-Type': 'text/xml',
      'Authorization': 'Basic U1lTVVNFUjpzeXN1c2VyMDA='
    };

    // Make the SOAP request to the SOAP API endpoint
    const soapResponse = await axios.post('http://14.141.75.90:8009/ouaf/XAIApp/xaiserver/CmBotPocInterfaceV2', xmlPayload, { headers });

    // Convert the SOAP response to JSON
    const xmlParser = new xml2js.Parser({ explicitArray: false });
    xmlParser.parseString(soapResponse.data, (err, result) => {
      if (err) {
        throw new Error(err);
      }

      // Extract the desired data from the SOAP response
      const response = result['soapenv:Envelope']['soapenv:Body']['CmBotPocInterfaceV2']['response'];
      const message = response.message;
      const caseId = response.caseId;

      // Prepare the REST API response
      const restResponse = {
        message: `${message}\nand your Request Id is ${caseId}`
      };

      // Send the REST API response
      res.status(200).json(restResponse);
    });
  } catch (error) {
    // Handle any errors that occurred during the conversion or request
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, "0.0.0.0", function () {
  console.log(`Server is running on port ${port}`);
});


