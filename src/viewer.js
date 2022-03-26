
/** 
 * 
 * Hook up visualistion element
 * 
 * @argument {AudioContext} context  
 * @returns {AnalyserNode} node
 * */
export const createViewer = (context) => {
    const node = new AnalyserNode(context)

    // 
    console.log("created viewer")

    return node;
}