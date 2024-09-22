const express = require("express");
require("dotenv").config();
const connection = require("./databaseConnection");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/register", (req, res) => {
    const { name, address } = req.body;
    console.log(name,address);
    
    const createUserTable = `
        CREATE TABLE IF NOT EXISTS User (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );
    `;

    const createAddressTable = `
        CREATE TABLE IF NOT EXISTS Address (
            id INT AUTO_INCREMENT PRIMARY KEY,
            address VARCHAR(255) NOT NULL,
            userID INT,
            FOREIGN KEY (userID) REFERENCES User(id) ON DELETE CASCADE
        );
    `;
    connection.query(createUserTable, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error creating User table: ' + err });
        }

        connection.query(createAddressTable, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating Address table: ' + err });
            }

            const checkUser = `SELECT id FROM User WHERE name = ?`;
            connection.query(checkUser, [name], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Error checking user existence: ' + err });
                }

                if (results.length > 0) {
                    const userID = results[0].id;
                    const insertAddress = `INSERT INTO Address (address, userID) VALUES (?, ?)`;
                    connection.query(insertAddress, [address, userID], (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Error inserting address: ' + err });
                        }
                        res.status(200).json({ message: 'Address added for existing user!' });
                    });
                } else {
                    const insertUser = `INSERT INTO User (name) VALUES (?)`;
                    connection.query(insertUser, [name], (err, result) => {
                        if (err) {
                            return res.status(500).json({ error: 'Error inserting new user: ' + err });
                        }

                        const userID = result.insertId;
                        const insertAddress = `INSERT INTO Address (address, userID) VALUES (?, ?)`;
                        connection.query(insertAddress, [address, userID], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error inserting address: ' + err });
                            }
                            res.status(200).json({ message: 'User and address added successfully!' });
                        });
                    });
                }
            });
        });
    });
    
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is listening on localhost:${port}`);
});
