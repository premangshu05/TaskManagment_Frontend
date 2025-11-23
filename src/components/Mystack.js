class MyStack{
    constructor(capacity = 100){
        this.data={};
        this.top = -1
        this.capacity=capacity
    }

    push(item){
        if(this.top+1===this.capacity){
            throw new Error("Stack Overflow");
        }
        this.top++;
        this.data[this.top]=item;
    }

    pop(){
        if(this.isEmpty()){
            throw new Error("Stack Underflow");
        }
        const item = this.data[this.top];
        delete this.data[this.top]
        this.top--
        return item
    }

    peek(){
        if(this.isEmpty()){
            throw new Error("Stack Underflow");
        }
        return this.data[this.data]
    }

    isEmpty(){
        return this.top===-1
    }

    clear(){
        this.data={};
        this.top=-1;
    }

    size(){
        return this.top+1;
    }


}

export default MyStack;