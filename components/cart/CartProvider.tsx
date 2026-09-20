"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import type {Product} from "@/data/products";
type CartItem=Product&{quantity:number}; type Ctx={items:CartItem[];count:number;subtotal:number;add:(p:Product)=>void;remove:(id:string)=>void;update:(id:string,q:number)=>void;clear:()=>void};
const C=createContext<Ctx|null>(null),KEY="utech_cart";
export function CartProvider({children}:{children:React.ReactNode}){const[items,setItems]=useState<CartItem[]>([]);useEffect(()=>{try{const s=localStorage.getItem(KEY);if(s)setItems(JSON.parse(s))}catch{}},[]);useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(items))},[items]);const value=useMemo(()=>({items,count:items.reduce((s,i)=>s+i.quantity,0),subtotal:items.reduce((s,i)=>s+i.price*i.quantity,0),add:(p:Product)=>setItems(c=>{const f=c.find(i=>i.id===p.id);return f?c.map(i=>i.id===p.id?{...i,quantity:i.quantity+1}:i):[...c,{...p,quantity:1}]}),remove:(id:string)=>setItems(c=>c.filter(i=>i.id!==id)),update:(id:string,q:number)=>setItems(c=>q<1?c.filter(i=>i.id!==id):c.map(i=>i.id===id?{...i,quantity:q}:i)),clear:()=>setItems([])}),[items]);return <C.Provider value={value}>{children}</C.Provider>}
export function useCart(){const c=useContext(C);if(!c)throw new Error("useCart must be used inside CartProvider");return c}
