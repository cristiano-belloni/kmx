define(['require', 'github:janesconference/KievII@0.6.0/kievII'], function(require, K2) {

    var imgResources = null;

    /* This gets returned to the host as soon as the plugin is loaded */ 
    var pluginConf = {
        name: "KMX",
        osc: false,
        audioIn: 4,
        audioOut: 1,
        version: '0.0.1-alpha1',
        ui: {
            type: 'canvas',
            width: 537,
            height: 680
        }
    };
  
    /* This gets called when all the resources are loaded */
    var pluginFunction = function (args, resources) {
        this.name = args.name;
        this.id = args.id;

        if (args.initialState && args.initialState.data) {
            /* Load data */
            this.pluginState = args.initialState.data;    
        }
        else {
            /* Use default data */
            this.pluginState = {
                gainFader0: 0.5,
                gainFader1: 0.5,
                gainFader2: 0.5,
                gainFader3: 0.5,
                lowKnob0: 0.5,
                lowKnob1: 0.5,
                lowKnob2: 0.5,
                lowKnob3: 0.5,
                midKnob0: 0.5,
                midKnob1: 0.5,
                midKnob2: 0.5,
                midKnob3: 0.5,
                hiKnob0: 0.5,
                hiKnob1: 0.5,
                hiKnob2: 0.5,
                hiKnob3: 0.5,
                trimKnob0: 0.5,
                trimKnob1: 0.5,
                trimKnob2: 0.5,
                trimKnob3: 0.5,
                masterVolKnob: 1
            };
        }

        var faderImage =  resources[0];
        var slotImage =  resources[1];
        var blackKnobImage =  resources[2];
        var redKnobImage = resources[3];
        var deckImage = resources[4];
        
        var nOfChannels = args.audioSources.length;
        
        // The sound part
        this.audioSources = args.audioSources;
        this.audioDestination = args.audioDestinations[0];
        this.context = args.audioContext;
        var context = this.context;
        this.gainMixerNodes = [];
        this.lowFilters = [];
        this.midFilters = [];
        this.highFilters = [];
        this.trimNodes = [];
        this.masterGainNode = context.createGainNode();
        
        for (var i = 0; i < this.audioSources.length; i+=1) {
            this.gainMixerNodes[i] = context.createGainNode();
            this.audioSources[i].connect(this.gainMixerNodes[i]);
            
            this.lowFilters[i] = context.createBiquadFilter(),
            this.midFilters[i] = context.createBiquadFilter(),
            this.highFilters[i] = context.createBiquadFilter();
        
             // Set the filter types (you could set all to 5, for a different result, feel free to experiment)
             // Set the filter gains to  0 (gain = boost in dB)
             this.lowFilters[i].type = 3;
             this.lowFilters[i].gain.value = 0;
             this.lowFilters[i].frequency.value = 220;
             this.midFilters[i].type = 5;
             this.midFilters[i].gain.value = 0;
             this.midFilters[i].frequency.value = 1000;
             this.highFilters[i].type = 4;
             this.highFilters[i].frequency.value = 6000;
             this.highFilters[i].gain.value = 0;
             
             this.trimNodes[i] = context.createGainNode();
             this.trimNodes[i].gain.value = 1;
            
             // Create and connect the filter chain
             this.gainMixerNodes[i].connect(this.lowFilters[i]);
             this.lowFilters[i].connect(this.midFilters[i]);
             this.midFilters[i].connect(this.highFilters[i]);
             this.highFilters[i].connect(this.trimNodes[i]);
             this.trimNodes[i].connect (this.masterGainNode);
             this.masterGainNode.connect(this.audioDestination);
        }
        
        // The canvas part
        this.ui = new K2.UI ({type: 'CANVAS2D', target: args.canvas});
        
        var idPrefix = "gainFader";
        
        var spaceWidth = 131;
        
        /* deck */
       var bgArgs = new K2.Background({
            ID: 'background',
            image: deckImage,
            top: 0,
            left: 0
        });
    
        this.ui.addElement(bgArgs, {zIndex: 0});
        
        /* slider */
        vSliderArgs = {
                ID: "",
                left: spaceWidth,
                top : 448,
                sliderImg: slotImage,
                knobImg: faderImage,
                onValueSet: function (slot, value, element) {
                    this.pluginState[element] = value;
                    var index = element.split(idPrefix)[1];
                    index = parseInt(index, 10);
                    var audioNode = this.gainMixerNodes[index];
                    audioNode.gain.value = 1 - value;
                    this.ui.refresh();
                }.bind(this),
                type:"vertical",
                isListening: true
            };
        
        for (var i = 0; i < nOfChannels; i += 1) {
            vSliderArgs.ID = idPrefix + i;
            vSliderArgs.left = (43 +  i * spaceWidth);
            this.ui.addElement(new K2.Slider(vSliderArgs));
            this.ui.setValue ({elementID: vSliderArgs.ID, value: this.pluginState[vSliderArgs.ID]});
        }
        
        /* Channel knobs */
        var knobArgs = {
             ID: "",
             left: spaceWidth,
             top: 0,
             sensitivity : 5000,
             tileWidth: 50,
             tileHeight: 50,
             imageNum: 50,
             bottomAngularOffset: 33,
             onValueSet: function (slot, value, element) {
                this.pluginState[element] = value;
                var index, realValue;
                if (element.indexOf("lowKnob") === 0) {
                    // Filter gain
                    realValue = K2.MathUtils.linearRange (0, 1, -12, 12, value);
                    index = element.split("lowKnob")[1];
                    index = parseInt(index, 10);
                    this.lowFilters[index].gain.value = realValue;
                    console.log ("L: index, value, realValue", index, value, realValue);
                }
                else if (element.indexOf("midKnob") === 0) {
                    // Filter gain
                    realValue = K2.MathUtils.linearRange (0, 1, -12, 12, value);
                    index = element.split("midKnob")[1];
                    index = parseInt(index, 10);
                    this.midFilters[index].gain.value = realValue;
                    console.log ("M: index, value, realValue", index, value, realValue);
                 }
                 else if (element.indexOf("hiKnob") === 0) {
                    // Filter gain
                    realValue = K2.MathUtils.linearRange (0, 1, -12, 12, value);
                    index = element.split("hiKnob")[1];
                    index = parseInt(index, 10);
                    this.highFilters[index].gain.value = realValue;
                    console.log ("H: index, value, realValue", index, value, realValue);
                 }
                 else if (element.indexOf("trimKnob") === 0) {
                    // Trim gain
                    if (value < 0.5) {
                        realValue = K2.MathUtils.linearRange (0, 0.5, 0, 1, value);
                    }
                    else {
                       realValue = K2.MathUtils.linearRange (0.5, 1, 1, 12, value);
                    }
                    index = element.split("trimKnob")[1];
                    index = parseInt(index, 10);
                    this.trimNodes[index].gain.value = realValue;
                    console.log ("T: index, value, realValue", index, value, realValue);
                }
                else {
                    console.error ("Cannot parse element", element);
                }
                this.ui.refresh();
             }.bind(this),
             isListening: true
         };
         
         var id_lmh = ["trimKnob", "hiKnob", "midKnob", "lowKnob"];
         
         for (var knobtype = 0; knobtype < id_lmh.length; knobtype += 1) {
             knobArgs.top = 96 + 86 * knobtype;
             if (id_lmh[knobtype] === "trimKnob") {
                    knobArgs.imagesArray = [redKnobImage];
                }
                else {
                    knobArgs.imagesArray = [blackKnobImage];
                }
             for (i = 0; i < nOfChannels; i += 1) {
                knobArgs.ID = id_lmh[knobtype] + i;
                knobArgs.left = (45 + i * spaceWidth);
                this.ui.addElement(new K2.Knob(knobArgs));
                this.ui.setValue ({elementID: knobArgs.ID, value: this.pluginState[knobArgs.ID]});
            }
        }
		
		/* Master Volume knob */
        var masterKnobArgs = {
            ID: "masterVolKnob",
            left: 478,
            top: 18,
			imagesArray: [redKnobImage],
            sensitivity : 5000,
            tileWidth: 50,
            tileHeight: 50,
            imageNum: 50,
            bottomAngularOffset: 33,
            onValueSet: function (slot, value, element) {
                this.pluginState[element] = value;
                this.masterGainNode.gain.value = value;
                this.ui.refresh();
            }.bind(this),
            isListening: true
        };
		 
		this.ui.addElement(new K2.Knob(masterKnobArgs));
		this.ui.setValue ({elementID: masterKnobArgs.ID, value: this.pluginState[masterKnobArgs.ID]});
        
        this.ui.refresh();

        var saveState = function () {
            return { data: this.pluginState };
        };
        args.hostInterface.setSaveState (saveState);
        
        // Initialization made it so far: plugin is ready.
        args.hostInterface.setInstanceStatus ('ready'); 
  }
  
    /* This function gets called by the host every time an instance of
       the plugin is requested [e.g: displayed on screen] */        
    var initPlugin = function(initArgs) {
        var args = initArgs;

        var requireErr = function (err) {
            var failedId = err.requireModules && err.requireModules[0];
            requirejs.undef(failedId);
            args.hostInterface.setInstanceStatus ('fatal', {description: 'Error initializing plugin: ' + failedId});
        }.bind(this);

        if (imgResources === null) {
            var resList = [ './assets/images/vsliderhandle_50.png!image',
                            './assets/images/vsliderslot_empty.png!image',
                            './assets/images/lmh_series.png!image',
                            './assets/images/trim_series.png!image',
                            './assets/images/KMX-001_deck.png!image'
            ];

            require (resList,
                        function () {
                            imgResources = arguments;
                            pluginFunction.call (this, args, arguments);
                        }.bind(this),
                        function (err) {
                            requireErr (err);
                        });
        }

        else {
            pluginFunction.call (this, args, imgResources);
        }
    };
      
    return {
        initPlugin: initPlugin,
        pluginConf: pluginConf
    };
});