//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")
// const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected Successfully!!")
});
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];


const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Default Item 1"
});
const item2 = new Item({
  name: "Default Item 2"
});

const defaultItems = [item1, item2];




const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  // const day = date.getDate();
  Item.find({}, function(err, foundItems){
    if(err){
      console.log(err)
    } else{

      if(foundItems.length === 0){
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }else{
            console.log("Items inserted successfully!");
          }

          res.redirect("/");
        });
      } else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  });
});

app.get("/:customListName",function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Crate a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else{
        //Show the existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    } else{
      console.group(err);
    }
  })


})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  
});


app.post("/delete", function(req, res) {
  const itemToDeleteId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove({_id: itemToDeleteId}, function(err){
      if(err){
        console.log(err);
      } else{
        // console.log("Successfully Deleted!");
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemToDeleteId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }else{
        console.log(err);
      }
    })
  }

  
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
