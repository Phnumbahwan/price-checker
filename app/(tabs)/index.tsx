import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { openDatabaseSync } from 'expo-sqlite';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

const db = openDatabaseSync('itemsDB');

db.execAsync(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,
    name TEXT,
    price REAL
  );
`);

export default function HomeScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [itemName, setItemName] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<string>('');
  const [itemNameDisplay, setItemNameDisplay] = useState<string>('');
  const [itemPriceDisplay, setItemPriceDisplay] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // function saveItem() {
  //   if (!itemName || !itemPrice) return;
  //   db.runAsync('INSERT INTO items (barcode, name, price) VALUES (?, ?, ?)', [
  //     scannedBarcode,
  //     itemName,
  //     parseFloat(itemPrice),
  //   ]);

  //   setIsAdding(false);
  // }

  async function saveItem() {
    try {
      if (!itemName || !itemPrice) return;
      console.log(scannedBarcode)
      const existingItem = await db.runAsync(
        'SELECT * FROM items WHERE barcode = ?',
        [scannedBarcode]
      );
      console.log(existingItem)
      if (existingItem) {
        await db.runAsync(
          'UPDATE items SET name = ?, price = ? WHERE barcode = ?',
          [itemName, parseFloat(itemPrice), scannedBarcode]
        );
      } else {
        await db.runAsync(
          'INSERT INTO items (barcode, name, price) VALUES (?, ?, ?)',
          [scannedBarcode, itemName, parseFloat(itemPrice)]
        );
      }

      setIsAdding(false);
    } catch (error) {
      console.log(error)
    }
  }


  const handleBarcodeScanned = (barcode: BarcodeScanningResult) => {
    setScannedBarcode(barcode.data);
    const result = db.getFirstSync('SELECT * FROM items WHERE barcode = ?', [barcode.data]);

    if (result) {
      // setItemNameDisplay(result.name);
      // setItemPriceDisplay(result.price.toString());
      setItemName(result.name);
      setItemPrice(result.price.toString());
      setIsAdding(false);
      console.log('Display now!');
    } else {
      setItemName('');
      setItemPrice('');
      setIsAdding(true);
    }

  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'code128'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* {!isAdding && (
        <View style={styles.detailsContainer}>
          <Text style={styles.text}>Name: {itemNameDisplay}</Text>
          <Text style={styles.text}>Price: ${itemPriceDisplay}</Text>
        </View>
      )}

      {isAdding && (
        <View style={styles.addItemContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Item Name"
            value={itemName}
            onChangeText={setItemName}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Item Price"
            value={itemPrice}
            onChangeText={setItemPrice}
            keyboardType="numeric"
          />
          <Button title="Save Item" onPress={saveItem} />
        </View>
      )} */}
      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Item Name"
          value={itemName}
          onChangeText={setItemName}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Item Price"
          value={itemPrice}
          onChangeText={setItemPrice}
          keyboardType="numeric"
        />
        <Button title="SAVE" onPress={saveItem} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginTop: 20,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  detailsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  addItemContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  input: {
    color: 'white',
    width: 'auto',
    minWidth: 100,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
});
