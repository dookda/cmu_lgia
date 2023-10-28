import React from 'react'

const LayerControl = () => {



    return (
        <>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" value="" id="lyr" />
                <label className="form-check-label" >
                    Default checkbox
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" value="" id="flexCheckChecked" />
                <label className="form-check-label" >
                    Checked checkbox
                </label>
            </div>
        </>
    )
}

export default LayerControl