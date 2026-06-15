import { Link, Navigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { getLists } from "../features/lists/listSlice";
import Spinner from "./Spinner";
import BackButton from "../components/BackButton";
import ShoppingList from "./ShoppingList";
import Select, { StylesConfig } from 'react-select';
import { AiFillDelete } from "react-icons/ai";
import {createListName, getListNames, reset} from '../features/listName/listNameSlice'
import { useLocalStorage } from "@uidotdev/usehooks";
import { gerUserLists, getUserLists, updateLastBought, updateUserList, updateAll} from "../features/auth/authSlice"
import { GiSightDisabled } from "react-icons/gi";
import { useNavigate, useParams } from "react-router-dom";
import { CiSaveUp1 } from "react-icons/ci";
import { Container, Row, Col } from "react-bootstrap";
import { FaArrowCircleLeft } from 'react-icons/fa'





function ShoppingListDetails(){
    var shoppingList = localStorage.getItem('shoppingList')
    // var doneShoppingList = localStorage.getItem('doneItems')
    // var doneShoppingListObject = JSON.parse(doneShoppingList)
    //var shoppingList = localStorage.getItem('shoppingList')
    var shoppingListObject = JSON.parse(shoppingList)

    

   // var completedListObject = JSON.parse(completedList)
    const { listNames } = useSelector((state) => state.listNames)
    const { allLists } = useSelector((state) => state.allLists)
    const [c, setc] = useState(false)
    const [d, setd] = useState(false)
    const [colorValue, setColorValue] = useLocalStorage('color')
    const [name, setName] = useState('')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')
    const [unitPrice, setUnitPrice] = useState('')
    const [comment, setComment] = useState('')
    const [status, setStatus] = useLocalStorage('status')
    const [deleteTrue, setDeleteTrue] = useState(false)
    const [deleteT, setDeleteT] = useState(false)
    const [newListName, setNewListName] = useState('')
    const [ItemName, setItemName] = useState('')
    const [items, setItems] = useLocalStorage('items',[])
    const [unItems, setUnItems] = useState([])
    const [e, sete] = useState(false)
    const [completeCheck, setCompleteCheck] = useState(true)
    const [completedListItems, setCompletedListItems] = useLocalStorage('doneItems')
    const [selectName, setSelectName] = useState('')
    const [allName, setAllName] = useState([])
    const [ballName, setBallName] = useState([])
    const navigate = useNavigate()
    const [updateNewUnitPrice, setUpdateNewUnitPrice] = useState('')
    const [updatNewPrice, setUpdateNewPrice] = useState('')
    const [updateNewQuantity, setUpdateNewQuantity] = useState('')
    const [updateNewComment, setUpdateNewComment] = useState('')
    const [updateNewBrand, setUpdateNewBrand] = useState('')
    const [editItems, setEditItems] = useLocalStorage('editItems')
    const clearEntry = ""

    const [backToList, setbackToList] = useState([])
    const [k, setk] = useState(false)
    const [unCompletedListItems, setUnCompletedListItems] = useLocalStorage('MainList')

    const [n, setn] = useState([])

    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(getUserLists())
        dispatch(getListNames())
        dispatch(reset())
    },  [ dispatch])   

    const listNameArray = []

     listNames.map((x) => {
        listNameArray.push(x.ItemName)
    })
    const existingListNameArray = []
    
    listNames.map((x) => {
        existingListNameArray.push(x)
    })
  
    console.log(existingListNameArray)
    const selectListName = (e) => {
        setNewListName(e.target.value)
    } 
    var ReviewedLis
    ReviewedLis = localStorage.getItem('doneItems', [])


    const disableItem = (index) => {
        let elements = getElementsfromLocalStorage();
        elements = elements.filter((item, i) => i == index);
        let listItemId = elements[0]._id
        let updateUserListData = {itemDisabled : true, shoppingInProgress: true}
        dispatch(updateUserList({ listItemId, updateUserListData }))
        let elementa = getElementsfromLocalStorage();
        let elemento = elementa.filter((item, i) => i !== index);
        localStorage.setItem('shoppingList', JSON.stringify(elemento));
        setUnCompletedListItems(JSON.parse(localStorage.getItem('shoppingList')))

        dispatch(getUserLists())
        let y = elements.map(x => x)
        let r = [ballName, ...y]
        let u = r.flat()
            setBallName(u)
    }

    const v = allLists.filter(f => shoppingListObject.every(item => item._id !== f._id));
    const addShoppingListItem = () => {
        setc(!c)
    }

    const addNewListaName = () => {
        setd(!d)
    }
    const onChangeName = (e) =>{
        setName(e.target.value)
    }

    const onQuantityChange = (e) =>{
        setQuantity(e.target.value)
    }
    const onChangeUnitPrice = (e) =>{
        setUnitPrice(e.target.value)
    }
    const onChangeComment = (e) =>{
        setComment(e.target.value)
    }

    const onListNameChange = (e) =>{
        setItemName(e.target.value)
    }

    const oldInfo = JSON.parse(localStorage.getItem('shoppingList'));

    let addNewItem = {
    
        name: name,
        quantity: Number(quantity),  
        unitPrice: Number(unitPrice),
        comment: comment,
        price: Number(quantity * unitPrice)
      
    }

    const onSubmit = () => {
        setc(!c)
        localStorage.setItem('shoppingList', JSON.stringify([...oldInfo, addNewItem ]))

         clearQuantityEntry()
         clearUnitPriceEntry()
         clearNameEntry()
         clearCommentEntry()
         clearListNameEntry()
    }
    const submitName = () => {
        setc(!c)
        let s = [...oldInfo, selectName ].flat()
        localStorage.setItem('shoppingList', JSON.stringify(s))
    }

    const submitDisabledName= () => {
        setc(!c)
        let s = [...oldInfo, selectName ].flat()
        localStorage.setItem('shoppingList', JSON.stringify(s))
        let listItemId = selectName[0]._id
        let updateUserListData = {itemDisabled : false, shoppingInProgress: true}
        dispatch(updateUserList({ listItemId, updateUserListData }))
        let ip = ballName.filter(f => selectName.every(item => item._id !== f._id));
        console.log(ip)
            setBallName(ip)

    }

    const onSelectName = (e) => {
        
        let x = e.target.value
        
        let generalList = v.filter((item) => item.name == x)

        setSelectName(generalList)

        return generalList
    }
    
const onSelectDisabledName = (e) => {
        
    let x = e.target.value
    
    let generalList = ballName.filter((item) => item.name == x)
    let ou = ballName.filter((item) => item.name !== x)
    setSelectName(generalList)
    return generalList
}

    const getNames = () => {
    }
    const onSubmitNewListName = (e) => {
        setd(!d)
        e.preventDefault()
        dispatch(createListName({  ItemName }))

        dispatch(getListNames())
        listNames.map((x) => {
            listNameArray.push(x.ItemName)
        })
        dispatch(getListNames())
    }

    const changeColor = (e) => {
        if (e.target.value == '1') {
            setColorValue('#e6b0aa')
            setStatus(e.target.value)
        }
        if (e.target.value == '2') {
            setColorValue('#d7bde2')
            setStatus(e.target.value)
        }
        if (e.target.value == '3') {
            setColorValue('#aed6f1')
            setStatus(e.target.value)
        }
        if (e.target.value == '4') {
            setColorValue('#fad7a0')
            setStatus(e.target.value)
        }
        if (e.target.value == '5') {
            setColorValue('#a9dfbf')
            setStatus(e.target.value)
        }


    }

    const ungetElementsfromLocalStorage = () => {
        let elements = [];
        if (localStorage.getItem('doneItems')) {
            elements = JSON.parse(localStorage.getItem('doneItems'));
        }
        return elements;
    }

    const getElementsfromLocalStorage = () => {
        let elements = [];
        if (localStorage.getItem('MainList')) {
            elements = JSON.parse(localStorage.getItem('MainList'));
        }
        return elements;
    };
    
    const removeElementLocalStorage = (name) => {
      
    };

    const deleteItem = (index) => {
        let elementa = getElementsfromLocalStorage();
        let elements = elementa.filter((item, i) => i !== index);
        localStorage.setItem('shoppingList', JSON.stringify(elements));
        setUnCompletedListItems(JSON.parse(localStorage.getItem('shoppingList')))
       let  elementy = elementa.filter((item, i) => i == index);

        let y = elementy.map(x => x)
        let r = [v, ...y]
        let u = r.flat()
            setAllName(u)
        }
    
    const unDeleteItem = (index) => {
        let elements = ungetElementsfromLocalStorage();
        elements = elements.filter((item, i) => i !== index)
        setItems(elements)
        if(items.length){
            setCompletedListItems([items])
        }
        }
    const addCompleted = () => {
        let completed = [];
        if (localStorage.getItem('shoppingList')) {
            completed = JSON.parse(localStorage.getItem('shoppingList'));
        }
        return completed;
    };

    const removeCompleted = () => {
        let unCompleted = [];
        if (localStorage.getItem('doneItems')) {
            unCompleted = JSON.parse(localStorage.getItem('doneItems'));
        }
        return unCompleted;
    };

    const checkedd = (i, name) => {
        setk(false)
        let completed = addCompleted();
        let Checked = completed.filter((element =>element.name == name));
        setItems([...Checked, ...items])
        deleteItem(i)
    }

    let unChecked = []
    const uncheckedd = (i, name) => {
        setk(true)
        let unCompleted = removeCompleted();
        unChecked = unCompleted.filter((element =>element.name == name));
        localStorage.setItem('shoppingList', JSON.stringify([...oldInfo, unChecked ].flat()));
        unDeleteItem(i)
    }


const updateRecords = () =>{
    dispatch(updateAll(JSON.parse(ReviewedLis)))
    dispatch(getListNames())
    navigate('/listName')
    localStorage.setItem('items', [])
    localStorage.setItem('color', [])
    localStorage.setItem('status', [])
    localStorage.setItem('MainList', [])
    localStorage.setItem('doneItems', [])
    localStorage.setItem('shoppingList', [])
}
const setNewUnitPrice = (e) => {
    setUpdateNewUnitPrice(e.currentTarget.textContent)
}
const setNewPrice = (e) => {
    setUpdateNewPrice(e.currentTarget.textContent)
}
const setNewQuantity = (e) => {
    setUpdateNewQuantity(e.currentTarget.textContent)
}
const setNewComment = (e) => {
    setUpdateNewComment(e.currentTarget.textContent)
}
const setNewBrand = (e) => {
    setUpdateNewBrand(e.currentTarget.textContent)
}


const addItemToEdit = (index, x) =>{
    let addNewItem = {
        createdAt: x.createdAt,
        frequency: x.frequency,
        itemDisabled: x.itemDisabled,
        listName: x.listName,
        name: x.name,
        shoppingInProgress: x.shoppingInProgress,
        totalSpent: x.totalSpent,
        updatedAt: x.updatedAt,
        user: x.user,
        _id: x._id,
        boughtAt: x.boughtAt,
        ...(updateNewBrand == '' ? {brand: x.brand} : {brand: updateNewBrand}),
        ...(updateNewComment == '' ? {comment: x.comment} : {comment: updateNewComment}),
        ...(updatNewPrice == '' ? {price: x.price} : {price: Number(updatNewPrice)}),
        ...(updateNewQuantity == '' ? {quantity: x.quantity} : {quantity: Number(updateNewQuantity)}),
        ...(updateNewUnitPrice == '' ? {unitPrice: x.unitPrice} : {unitPrice: Number(updateNewUnitPrice)}),
    }
    setEditItems(addNewItem)
}


const saveRecords = () => {}
const saveChangesCompleted = (i) => {
    setUpdateNewBrand('')
    setUpdateNewComment('')
    setUpdateNewUnitPrice('')
    setUpdateNewQuantity('')

    let elements = ungetElementsfromLocalStorage();
    elements = elements.filter((item, index) => index !== i)
    setItems([...elements, editItems])
    if(items.length){
        setCompletedListItems([items])
    }
}

const clearQuantityEntry = () => {
    setQuantity(clearEntry)
}
const clearUnitPriceEntry = () => {
    setUnitPrice(clearEntry)
}
const clearNameEntry = () => {
    setName(clearEntry)
}
const clearCommentEntry = () => {
    setComment(clearEntry)
}
const clearListNameEntry = () => {
    setItemName(clearEntry)
}

const saveChanges = (index) => {
    let elements = getElementsfromLocalStorage();
    elements = elements.filter((item, i) => i !== index);
    localStorage.setItem('shoppingList', JSON.stringify([...elements, editItems ].flat()));
    setUnCompletedListItems(JSON.parse(localStorage.getItem('shoppingList')))
}

    setCompletedListItems(items)
 
    let m = [...oldInfo , unItems ]
    setUnCompletedListItems(m.flat())
    
    const t = listNames.filter(md => 
        shoppingListObject.some(fd => fd.listName == md._id))

        let gg = t.map(x => x.ItemName)

    if(shoppingListObject.listName == listNames._id)

  return (
    <Container className="wholeBody">
        <div>
            <button className='btn btn-reverse btn-back' onClick={() => navigate('/listName')}>
                <FaArrowCircleLeft /> Back
            </button>
            <div  className="statuses-style">
                <label className="label-text">
                    Status
                    <form action="#">
                        <select value={status} style={{background:colorValue}} className="statuses" name="selectedFruit" id="s" onChange={changeColor}>
                            <option value="1">Ready to Shop</option>
                            <option value="2">Shopping in progress</option>
                            <option value="3">Shopping Done</option>
                            <option value="4">Review in Progress</option>
                        </select>
                    </form>
                </label>
            </div>

        </div>

        <>
        <Row>
        {
        c == true ?
            <section > 
                <form className="list-input" onSubmit={onSubmit}>
                    <Row>
                        <Col xs={12} md={6} sm={6} lg={3}>
                            <section className='form-list'>
                                <label className="list-label">Name</label>
                                <div className="form-group form-line ">
                                    <input
                                        type='text'
                                        className='form-control'
                                        id = 'name'
                                        name = 'name'
                                        value = {name}
                                        onChange={onChangeName}
                                        placeholder='Name'
                                    />
                                    <button type="button" className='btn btn-span' onClick={clearNameEntry}>x</button>
                                </div>
                            </section>
                        </Col>
                        <Col xs={12} md={6} sm={6} lg={3}>
                            <section className='form-list'>
                                <label className="list-label">Unit Price</label>
                                <div className="form-group form-line ">
                                    <input
                                        type='number'
                                        className='form-control'
                                        id = 'unitPrice'
                                        name = 'unitPrice'
                                        value = {unitPrice}
                                        onChange={onChangeUnitPrice}
                                        placeholder='Unit Price'
                                    />
                                    <button type="button" className='btn btn-span' onClick={clearUnitPriceEntry}>x</button>
                                </div>
                            </section>
                        </Col>
                        <Col xs={12} md={6} sm={6} lg={3}>
                            <section className='form-list'>
                                <label className="list-label">Quantity</label>
                                <div className="form-group form-line ">
                                    <input
                                        type='number'
                                        className='form-control'
                                        id = 'quantity'
                                        name = 'quantity'
                                        value = {quantity}
                                        onChange={onQuantityChange}
                                        placeholder='Quantity'
                                    />
                                    <button type="button" className='btn btn-span' onClick={clearQuantityEntry}>x</button>
                                </div>
                            </section>
                        </Col>
                        <Col xs={12} md={6} sm={6} lg={3}>
                            <section className='form-list'>
                                <label className="list-label">Comment</label>
                                <div className="form-group form-line ">
                                    <input
                                        type='text'
                                        className='form-control'
                                        id = 'comment'
                                        name = 'comment'
                                        value = {comment}
                                        onChange={onChangeComment}
                                        placeholder='comment'
                                    />
                                    <button type="button"className='btn btn-span' onClick={clearCommentEntry}>x</button>
                                </div>
                            </section>
                        </Col>
                        <Col xs={12} md={6} sm={6} lg={3}>
                            <div className="enter-button">
                                <button type= 'submit' className='btn'>Enter</button>
                            </div>
                        </Col>
                    </Row>
                </form>
            </section>
        :
        null
        }
        </Row>
        <hr></hr>
        {
        c == true ?
            <Row>
                <Col xs={12} md={6} sm={6} lg={6}>
                    <div style={{ alignItems:"left", Width: '500px', marginRight: "100px"}}>
                        <section>
                            <form onSubmit={submitName}>
                                <h4 style={{margin: "15px 70px 15px 0"}} className="">Add By Name</h4>
                                <div style={{gridTemplateColumns: "repeat(2, 1fr)", display: 'flex'}}>
                                    <div style={{marginRight: "15px"}}>
                                        <select onChange={onSelectName} onClick={getNames} className="name-select" >
                                            <option value="" disabled selected>Select Item</option>
                                            {v.map((x,i) => (
                                                <>
                                                    <option key={x} value={x.name}>
                                                        {x.name}
                                                    </option>
                                                </>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="">
                                        <button type= 'submit' className='btn'>Enter</button>
                                    </div> 
                                </div>
                            </form>
                        </section>
                    </div>
                </Col>
                <Col xs={12} md={6} sm={6} lg={6}>
                    <div style={{ alignItems:"right", maxWidth: '500px'}}>
                        <section>
                            <form onSubmit={submitDisabledName} >
                                <h4 style={{margin: "15px 70px 15px 0"}} className="">Add Disabled List Items</h4>
                                <div style={{gridTemplateColumns: "repeat(2, 1fr)", display: 'flex'}}>
                                    <div style={{marginRight: "15px"}}>
                                        <select onChange={onSelectDisabledName}  className="name-select" >
                                            <option value="" disabled selected>Select Item</option>
                                            {ballName.map((x,i) => (
                                                <>
                                                    <option key={x} value={x.name}>
                                                        {x.name}
                                                    </option>
                                                </>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="">
                                        <button type= 'submit' className='btn'>Enter</button>
                                    </div> 
                                </div>
                            </form>
                        </section>
                    </div>
                </Col>
            </Row>
        :
        null
        }
        {
        d == true ?
            <Row>
                <Col xs={12} md={6} sm={6} lg={6}>
                    <section > 
                        <form className="list-input" onSubmit={onSubmitNewListName}>
                            <section className='form-list'>
                                    <label className="list-label">ListName</label>
                                    <div className="form-group form-line ">
                                        <input
                                            type='text'
                                            className='form-control'
                                            id = 'newListName'
                                            name = 'newListName'
                                            value = {ItemName}
                                            onChange={onListNameChange}
                                            placeholder='listName'
                                        />
                                        <button type="button" className='btn btn-span' onClick={clearListNameEntry}>x</button>
                                    </div>
                            </section>
                            <div className="enter-button">
                                <button type= 'submit' className='btn'>Enter</button>
                            </div>
                        </form>    
                    </section>
                </Col>
            </Row>
        :
        null
        }
        {
            //Review Completed
            colorValue === '#a9dfbf' ?
            null
            :
            <div className="btn-generate">
                <button type="button" className='btn' onClick={addShoppingListItem}>Add Item</button>
            </div>
           }

        {
            //Review Completed
            colorValue === '#fad7a0' ?
            <div className="btn-generate">
                <button type="button" className='btn' onClick={addNewListaName}>Add New ListName</button>
            </div>
            :
            null
           }
        </>
    <div className=''>
        {
            //Shopping in progress
            colorValue === '#d7bde2' ?
            <Row className='shoppingList-headings'>
                <Col xs={4} md={4} sm={2} lg={2}><div>Name</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Unit Price</div></Col>
                <Col xs={4} md={4} sm={2} lg={1}><div>Quantity</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Price</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Comment</div></Col>
                <Col xs={12} md={12} sm={12} lg={2}><div></div></Col>
            </Row>
            :
            //Shopping Done
            colorValue === '#aed6f1' ?
            <Row className='shoppingList-headings'>
                <Col xs={4} md={4} sm={2} lg={2}><div>Name</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Unit Price</div></Col>
                <Col xs={4} md={4} sm={2} lg={1}><div>Quantity</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Price</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Comment</div></Col>
                <Col xs={12} md={12} sm={12} lg={2}><div></div></Col>
            </Row>
            :
            //Review in Progress
            colorValue === '#fad7a0' ?
            <Row className='shoppingList-headings'>
                <Col xs={4} md={4} sm={3} lg={2}><div>ListName</div></Col>
                <Col xs={4} md={4} sm={3} lg={1}><div>Name</div></Col>
                <Col xs={4} md={4} sm={3} lg={1}><div>Brand</div></Col>
                <Col xs={4} md={4} sm={3} lg={1}><div>Unit Price</div></Col>
                <Col xs={4} md={4} sm={3} lg={1}><div>Quantity</div></Col>
                <Col xs={4} md={4} sm={3} lg={1}><div>Price</div></Col>
                <Col xs={4} md={4} sm={3} lg={1}><div>Frequency</div></Col>
                <Col xs={4} md={4} sm={3} lg={1}><div>Comment</div></Col>
                <Col xs={12} md={12} sm={12} lg={2}><div></div></Col>
            </Row>
            :
            // ready to shop
            <Row className='shoppingList-headings'>
                <Col xs={4} md={4} sm={2} lg={2}><div>Name</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Unit Price</div></Col>
                <Col xs={4} md={4} sm={2} lg={1}><div>Quantity</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Price</div></Col>
                <Col xs={4} md={4} sm={2} lg={2}><div>Comment</div></Col>
                <Col xs={12} md={12} sm={12} lg={2}><div></div></Col>
            </Row>
        }
        
    {   //Shopping in progress
        shoppingListObject.map((x, i) => (
            colorValue === '#d7bde2' ?
            <Row className='shoppingList shoppingList-headings-items' onKeyUp={() =>addItemToEdit(i, x)}>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div>{x.name}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" id = 'updateUnitPrice'name = 'updateUnitPrice'  onInput={setNewUnitPrice}  >{x.unitPrice}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={1}>
                    <div contenteditable="true" onInput={setNewQuantity}>{x.quantity}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" onInput={setNewPrice}>{x.price}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" onInput={setNewComment}>{x.comment}</div>
                </Col>
                <Col xs={12} md={12} sm={12} lg={2}>
                    <Row>
                        <Col>
                            <input checked={false} type="checkbox" className="checkboxSize" onClick={() => checkedd(i, x.name)}/>
                        </Col>
                        <Col>
                            <AiFillDelete style={{cursor:'pointer'}} onClick={() =>deleteItem(i)} />
                        </Col>
                        <Col>
                            <div><CiSaveUp1 style={{cursor:'pointer'}} onClick={() =>saveChanges(i)}/></div>
                        </Col>
                    </Row>
                </Col>
            </Row>

            :
            //Shopping Done
            colorValue === '#aed6f1' ?
            <Row className='shoppingList shoppingList-headings-items' onKeyUp={() =>addItemToEdit(i, x)}>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div>{x.name}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" id = 'updateUnitPrice'name = 'updateUnitPrice'  onInput={setNewUnitPrice}  >{x.unitPrice}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={1}>
                    <div contenteditable="true" onInput={setNewQuantity}>{x.quantity}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" onInput={setNewPrice}>{x.price}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" onInput={setNewComment}>{x.comment}</div>
                </Col>
                <Col xs={12} md={12} sm={12} lg={2}>
                    <Row>
                        <Col>
                            <input checked={false} type="checkbox" className="checkboxSize" onClick={() => checkedd(i, x.name)}/>
                        </Col>
                        <Col>
                            <AiFillDelete style={{cursor:'pointer'}} onClick={() =>deleteItem(i)} />
                        </Col>
                        <Col>
                            <div><CiSaveUp1 style={{cursor:'pointer'}} onClick={() =>saveChanges(i)}/></div>
                        </Col>
                    </Row>
                </Col>
            </Row>
            :
            //Review in Progress
            colorValue === '#fad7a0' ?
            <Row className='shoppingList shoppingList-headings-items' onKeyUp={() =>addItemToEdit(i, x)}>
                <Col xs={4} md={4} sm={3} lg={2}>
                    <div>
                        {
                        x.listName ?
                            existingListNameArray.filter(y => y._id == x.listName).map(e => e.ItemName)
                        : 
                        <select onChange={selectListName}  className="" >
                            {
                                listNameArray.map(x => (
                                <>
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                </>
                            ))}
                        </select>
                        }
                    </div>
                </Col>
                <Col xs={4} md={4} sm={3} lg={1}>
                    <div>{x.name}</div>
                </Col>
                <Col xs={4} md={4} sm={3} lg={1}>
                    <div>{x.brand}</div>
                </Col>
                <Col xs={4} md={4} sm={3} lg={1}>
                    <div contenteditable="true" id = 'updateUnitPrice'name = 'updateUnitPrice'  onInput={setNewUnitPrice}  >{x.unitPrice}</div>
                </Col>
                <Col xs={4} md={4} sm={3} lg={1}>
                    <div contenteditable="true" onInput={setNewQuantity}>{x.quantity}</div>
                </Col>
                <Col xs={4} md={4} sm={3} lg={1}>
                    <div contenteditable="true" onInput={setNewPrice}>{x.price}</div>
                </Col>
                <Col xs={4} md={4} sm={3} lg={1}>
                    <div contenteditable="true" onInput={setNewPrice}>{x.frequency}</div>
                </Col>
                <Col xs={4} md={4} sm={3} lg={1}>
                    <div contenteditable="true" onInput={setNewComment}>{x.comment}</div>
                </Col>
                <Col xs={12} md={12} sm={12} lg={2}>
                    <Row>
                        <Col>
                            <input checked={false} type="checkbox" className="checkboxSize" onClick={() => checkedd(i, x.name)}/>
                        </Col>
                        <Col>
                            <AiFillDelete style={{cursor:'pointer'}} onClick={() =>deleteItem(i)} />
                        </Col>
                        <Col>
                            <div><CiSaveUp1 style={{cursor:'pointer'}} onClick={() =>saveChanges(i)}/></div>
                        </Col>
                    </Row>
                </Col>
            </Row> 
            :
            // ready to shop
            <Row className='shoppingList shoppingList-headings-items' onKeyUp={() =>addItemToEdit(i, x)}>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div>{x.name}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" id = 'updateUnitPrice'name = 'updateUnitPrice'  onInput={setNewUnitPrice}  >{x.unitPrice}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={1}>
                    <div contenteditable="true" onInput={setNewQuantity}>{x.quantity}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" onInput={setNewPrice}>{x.price}</div>
                </Col>
                <Col xs={4} md={4} sm={2} lg={2}>
                    <div contenteditable="true" onInput={setNewComment}>{x.comment}</div>
                </Col>
                <Col xs={12} md={12} sm={12} lg={2}>
                    <Row>
                        <Col>
                            <div><CiSaveUp1 style={{cursor:'pointer'}} onClick={() =>saveChanges(i)}/></div>
                        </Col>
                        <Col>
                            <AiFillDelete style={{cursor:'pointer'}} onClick={() =>deleteItem(i)} />
                        </Col>
                        <Col>
                            <GiSightDisabled className="disableButton" onClick={() =>disableItem(i)}/>
                        </Col>
                    </Row>
                </Col>
            </Row>
                ))
            }   
                <h5 style={{margin: "20px 0", alignItems: "right"}}>Total: {shoppingListObject.reduce((n, {price}) => n + price, 0).toLocaleString()}</h5>
                <hr></hr>
            {
                // ready to shop
                colorValue === '#e6b0aa' ?
                null
                :
                <h4 style={{margin: "20px 0", alignItems: "right"}}>Completed Items :  
                    { completedListItems ?
                        completedListItems.reduce((n, {price}) => n + price, 0).toLocaleString()
                        :
                        null
                    }
                </h4>
            }
            { 
             completedListItems ?
                completedListItems.map((x, i) => (
                //Shopping Done
                colorValue === '#aed6f1' ?
                    <Row className='completedList shoppingList-headings-items' onKeyUp={() =>addItemToEdit(i, x)}>
                        <Col xs={4} md={4} sm={2} lg={2}>
                            <div>{x.name}</div>
                        </Col>
                        <Col xs={4} md={4} sm={2} lg={2}>
                            <div contenteditable="true" id = 'updateUnitPrice'name = 'updateUnitPrice'  onInput={setNewUnitPrice}  >{x.unitPrice}</div>                        </Col>
                        <Col xs={4} md={4} sm={2} lg={1}>
                            <div contenteditable="true" onInput={setNewQuantity}>{x.quantity}</div>
                        </Col>
                        <Col xs={4} md={4} sm={2} lg={2}>
                            <div contenteditable="true" onInput={setNewPrice}>{x.price}</div>
                        </Col>
                        <Col xs={4} md={4} sm={2} lg={2}>
                            <div contenteditable="true" onInput={setNewComment}>{x.comment}</div>
                        </Col>
                        <Col xs={12} md={12} sm={12} lg={2}>
                            <Row>
                                <Col>
                                    <input checked={true} type="checkbox" className="checkboxSize" onClick={() => uncheckedd(i, x.name)}/>
                                </Col>
                                <Col>
                                    <AiFillDelete style={{cursor:'pointer'}} onClick={() =>unDeleteItem(i)} />
                                </Col>
                                <Col>
                                    <div><CiSaveUp1 style={{cursor:'pointer'}} onClick={() =>saveChangesCompleted(i)}/></div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    :
                    //Shopping In Progress
                    colorValue === '#d7bde2'?
                        <Row className='completedList shoppingList-headings-items' onKeyUp={() =>addItemToEdit(i, x)}>
                            <Col xs={4} md={4} sm={2} lg={2}>
                                <div>{x.name}</div>
                            </Col>
                            <Col xs={4} md={4} sm={2} lg={2}>
                                <div contenteditable="true" id = 'updateUnitPrice'name = 'updateUnitPrice'  onInput={setNewUnitPrice}  >{x.unitPrice}</div>                        </Col>
                            <Col xs={4} md={4} sm={2} lg={1}>
                                <div contenteditable="true" onInput={setNewQuantity}>{x.quantity}</div>
                            </Col>
                            <Col xs={4} md={4} sm={2} lg={2}>
                                <div contenteditable="true" onInput={setNewPrice}>{x.price}</div>
                            </Col>
                            <Col xs={4} md={4} sm={2} lg={2}>
                                <div contenteditable="true" onInput={setNewComment}>{x.comment}</div>
                            </Col>
                            <Col xs={12} md={12} sm={12} lg={2}>
                                <Row>
                                    <Col>
                                        <input checked={true} type="checkbox" className="checkboxSize" onClick={() => uncheckedd(i, x.name)}/>
                                    </Col>
                                    <Col>
                                        <AiFillDelete style={{cursor:'pointer'}} onClick={() =>unDeleteItem(i)} />
                                    </Col>
                                    <Col>
                                        <div><CiSaveUp1 style={{cursor:'pointer'}} onClick={() =>saveChangesCompleted(i)}/></div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        :
                        //Review In Progress
                        colorValue === '#fad7a0' ?
                            <Row className='completedList shoppingList-headings-items' onKeyUp={() =>addItemToEdit(i, x)}>
                                <Col xs={4} md={4} sm={3} lg={2}>
                                    <div>
                                        {
                                        x.listName ?
                                            existingListNameArray.filter(y => y._id == x.listName).map(e => e.ItemName)
                                        : 
                                        <select onChange={selectListName}  className="" >
                                            {
                                                listNameArray.map(x => (
                                                <>
                                                    <option key={x} value={x}>
                                                        {x}
                                                    </option>
                                                </>
                                            ))}
                                        </select>
                                        }
                                    </div>
                                </Col>
                                <Col xs={4} md={4} sm={3} lg={1}>
                                    <div>{x.name}</div>
                                </Col>
                                <Col xs={4} md={4} sm={3} lg={1}>
                                    <div contenteditable="true" onInput={setNewBrand}>{x.brand}</div>
                                </Col>
                                <Col xs={4} md={4} sm={3} lg={1}>
                                    <div contenteditable="true" id = 'updateUnitPrice'name = 'updateUnitPrice'  onInput={setNewUnitPrice}  >{x.unitPrice}</div>
                                </Col>
                                <Col xs={4} md={4} sm={3} lg={1}>
                                    <div contenteditable="true" onInput={setNewQuantity}>{x.quantity}</div>
                                </Col>
                                <Col xs={4} md={4} sm={3} lg={1}>
                                    <div contenteditable="true" onInput={setNewPrice}>{x.price}</div>
                                </Col>
                                <Col xs={4} md={4} sm={3} lg={1}>
                                    <div contenteditable="true">{x.frequency}</div>
                                </Col>
                                <Col xs={4} md={4} sm={3} lg={1}>
                                    <div contenteditable="true" onInput={setNewComment}>{x.comment}</div>
                                </Col>
                                <Col xs={12} md={12} sm={12} lg={2}>
                                    <Row>
                                        <Col>
                                            <input checked={true} type="checkbox" className="checkboxSize" onClick={() => uncheckedd(i, x.name)}/>
                                        </Col>
                                        <Col>
                                            <AiFillDelete style={{cursor:'pointer'}} onClick={() =>unDeleteItem(i)} />
                                        </Col>
                                        <Col>
                                            <div><CiSaveUp1 style={{cursor:'pointer'}} onClick={() =>saveChangesCompleted(i)}/></div>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                    : 
                    null

                ))
                                        :
                        null
                }
                    {colorValue === '#fad7a0' ?
                    //review in progress
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', margin: "30px 0 30px 30px",}} className="">
                            <div></div>
                            <button style={{ justifySelf:"right", width: '300px'}}  onClick={updateRecords} className='btn'>Update Records</button>
                         </div>  
                    :
                        null
                    }


    </div>
    </Container>
  )
};

export default ShoppingListDetails;
