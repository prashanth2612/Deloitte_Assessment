const listAll = async(Model,req,res)=>{

    const sort = req.query.sort || 'desc';
    const enabled=req.query.enabled || undefined;

    let result;

    if(enabled === undefined){
        result = await Model.find({
            removed:false,
        })
        .sort({created:sort})
        .populate()
        .exec();


    }

    else{
        result = await Model.find({
            removed:false,
            enabled:enabled,
        })
        .sort({created:sort})
        .populate()
        .exec();
    }


    if(result.length > 0){
        return res.status(200).json({
            success:true,
            result,
            message:'SucessFully Found All Documents',
        });


    }else{
        return res.status(203).json({
            success:false,
            result:[],
            messgae:'Collection is Empty',
        });
    }
}

module.exports = listAll;