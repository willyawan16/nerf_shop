import { Box, Button, Divider, Stack } from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { modelData, modelDir } from './modelData';


export interface IProductColumnProps {
    key: any,
    modelName: string,
}

function ProductColumn(props: IProductColumnProps) {

    const navigate = useNavigate();
    
    const defaultParagraph = {
        margin: 0,
    }

    function goToProductPage() {
        navigate(
            `/product`,
            {
                state: {
                    modelName: props.modelName,
                }
            }
        )
        navigate(0)

    }

    return(
        <div key={props.key}>
            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <Box 
                    sx={{
                        width: '200px', 
                        height: '200px', 
                        margin: '40px',
                    }} 
                >
                    <img style={{width: '100%', height: '100%'}} alt='gongzai' src={modelDir + '/' + props.modelName + '_phone/screenshots/1.png'} />
                </Box>
                <Box sx={{paddingLeft: '0px', paddingRight: '20px', flex: 1}}>
                    <a style={{...defaultParagraph, ...{fontSize: 30, cursor: 'pointer'}}} onClick={goToProductPage}>{modelData[props.modelName].name}</a>
                    <Box sx={{height: '100px'}}>
                        <p style={{...defaultParagraph, ...{marginLeft: 10}}}>
                            {modelData[props.modelName].desc}
                        </p>
                    </Box>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                        <p style={{...defaultParagraph, ...{marginRight: 10, marginBottom: 10, color: 'red', fontSize: '25px'}}}>
                            <b>NT$ {modelData[props.modelName].price}</b>
                        </p>
                    </Box>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                        <Stack direction='row' spacing={2}>
                            <Button 
                                variant='outlined' 
                                // component={Link} 
                                // to={`/product/${props.modelName}`} 
                                sx={{color: 'black', borderColor: 'black'}}
                                onClick={goToProductPage}
                            >
                                    See more
                            </Button>
                            <Button variant='contained' sx={{backgroundColor: 'black'}}>Add to cart</Button>
                        </Stack>
                    </Box>
                </Box>
            </Box>
            <Divider />
        </div>
    );
}

export default ProductColumn;